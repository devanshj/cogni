import { t, command, option, argument } from "./targs";
import { ui } from "../ui";
import { toCogniOutput } from "../core";
import { toCogniProcess } from "../process-port";
import { terminal, withNodeProcess } from "staerm";

import chokidar from "chokidar"
import { emitKeypressEvents } from "readline";
import { spawn, ChildProcess, exec } from "child_process";

import { BehaviorSubject, Observable, Subject } from "rxjs";
import { switchMap, take } from "rxjs/operators";
import { fromEmitter } from "rxjs-from-emitter";
import { lines, grey, println, red, clear, print } from "./utils";
import { use, assertType } from "../utils";
import { promisify } from "util";


const run = command({
    action: async ([cogniProcess], {
        watchGlobs,
        buildProcess,
        showBuildOutput,
        noStdoutFallbackTimeout,
        stdoutBufferDebounceTime
    }) => {
        
        // ---
        // interactive check
        if (!process.stdin.isTTY) {
            println(red("[!] Error: "))
            println(`   You are not in an interactive terminal`)
            return;
        }

        // ---
        // staerm setup
        process.stdin.setRawMode!(true);
        emitKeypressEvents(process.stdin);
        let { io, state } = withNodeProcess(terminal(), process)
        let shouldSendKeypress$ = new BehaviorSubject(true);

        // ---
        // spawn
        let spawnArgs =
            use(cogniProcess.match(/^(\S*)\s*(.*)$/)!)
            .as(([, argh, argt]) =>
                [argh, argt.split(/\s+/)] as [string, string[]]
            );

        let runningProcess = null as ChildProcess | null;
        const spawnProcess = () => new Promise<ChildProcess | null>(resolve => {
            let newProcess = spawn(...spawnArgs);

            fromEmitter(newProcess)
            .eventStrict("error")
            .pipe(assertType<{ code: string }>())
            .subscribe(err=> {
                println();
                println(red("[!] Error: "))
                println(`   Could not spawn process "${spawnArgs[0]}" (${err.code})`)
                println();
                process.exit();
                resolve(null);
            });

            if (runningProcess) runningProcess.kill();
            runningProcess = newProcess;

            resolve(runningProcess);
        });

        // ---
        const execBuild = async () => {
            try {
                let { stdout, stderr } = await promisify(exec)(buildProcess!);
                return { stdout, stderr, exitCode: 0 as 0 };
            } catch ({ stdout, stderr }) {
                return { stdout: stdout as string, stderr: stderr as string, exitCode: 1 as 1 };
            }
        }

        const build = () => new Observable($ => {
            if (!buildProcess) {
                $.next();
                return;
            }

            const unsubscribe$ = new BehaviorSubject(false);

            clear();
            println();
            println(`Running build process "${buildProcess}"...`);
            execBuild().then(async ({ stdout, stderr, exitCode }) => {
                if (unsubscribe$.value) return;
                println(exitCode === 0 ? "Successful" : "Failed")

                if (showBuildOutput || exitCode !== 0) {    
                    println();
                    if (stdout) {
                        println("stdout:")
                        println(stdout);
                    }

                    if (stderr) {
                        println();
                        println("stderr:")
                        println(stderr);
                    }
    
                    println();
                    print("Press any key to continue ");
                    shouldSendKeypress$.next(false);
                    await new Promise(r => io.keypress.listen(r));
                    shouldSendKeypress$.next(true);
                    clear();
                    $.next();
                }
            })

            return () => {
                unsubscribe$.next(true);
                shouldSendKeypress$.next(true);
            }
        })

        // ---
        const refresh$ = new Subject<true>();
        if (watchGlobs) {
            fromEmitter(
                chokidar
                .watch(watchGlobs)
            )
            .eventStrict("change")
            .pipe(switchMap(build))
            .subscribe(() => refresh$.next(true))
        }
        
        await build().pipe(take(1)).toPromise();
        ui({
            keypress$: new Observable($ => {
                io.keypress.listen(k => {
                    if (shouldSendKeypress$.value) $.next(k)
                });
            }),
            spawnProcess: () =>
                spawnProcess()
                .then(p => p !== null ? toCogniProcess(p, {
                    noStdoutFallbackTimeout,
                    stdoutBufferDebounceTime
                }) : null),
            toCogniOutput,
            refresh$
        }).subscribe(state.set);
        
    },
    identifiers: ["run"],
    description: `run process with hot reloading & interactive stdin`,
    examples: [
        `$ cogni {{identifier}} "python hello.py"`,
        `$ cogni {{identifier}} "python reverse.py samplestring"`,
        `$ cogni {{identifier}} main.exe`
    ],
    arguments: [
        argument({
            signatureName: "process",
            type: t.string()
        })
    ],
    options: {
        "watchGlobs": option({
            signatureName: "globs",
            identifiers: ["-w", "--watch"],
            type: t.compose(t.string(), t.array(), t.minLength(1), t.optional()),
            description: `Watch file globs and invoke rerun when a file matching any glob changes. Use comma to separate globs.`,
            examples: [
                `$ cogni run "python hello.py" -w "hello.py, lib/**/*"`,
                `$ cogni run main.exe --watch main.c`
            ],
            parseErrorExamples: [
                `{{identifier}} "hello.py, lib/**/*"`,
                `{{identifier}} main.c`
            ]
        }),
        "buildProcess": option({
            signatureName: "build-process",
            identifiers: ["-b", "--build"],
            type: t.compose(t.string(), t.optional()),
            description: `Invoke a process before runing the main process.`,
            examples: [`$ cogni run main.exe --watch main.c --build "gcc main.c -o main.exe"`],
            parseErrorExamples: [`{{identifier}} "gcc main.c -o main.exe"`]
        }),
        "showBuildOutput": option({
            identifiers: ["-bo", "--build-output"],
            type: t.compose(t.boolean(), t.optional(false)),
            description: `Print output from build process. Useful if you want to see warnings from compiler.`,
            requires: ["buildProcess"]
        }),
        "noStdoutFallbackTimeout": option({
            signatureName: "value",
            identifiers: ["--no-stdout-fallback-timeout"],
            type: t.compose(t.number(), t.optional(500)),
            description: lines(
                `The amount of time in milliseconds to wait before feeding the next stdin line when there is no stdout.`,
                `Default 500`,
                grey(`If the process is taking consecutive stdin feeds without ` +
                `a stdout between them, then in such case lowering the timeout ` +
                `will result in faster update of output but beware not to make ` +
                `it too low or else it result in malformatted output updates.`)
            ),
            parseErrorExamples: [`{{identifier}} 500`]
        }),
        "stdoutBufferDebounceTime": option({
            signatureName: "value",
            identifiers: ["--stdout-buffer-debounce-time"],
            type: t.compose(t.number(), t.optional(50)),
            description: lines(
                `The maximum amount of delay in milliseconds allowed between two consecutive stdouts.`,
                `Default 50`,
                grey(`The idealistic value should be zero but sometimes stdout ` +
                `printed at the same time are also received in chunks with delay, ` + 
                `hence 50ms for safety. If you are seeing output that you don't expect ` + 
                `try incresing this value.`)
            ),
            parseErrorExamples: [`{{identifier}} 50`]
        }),
        "debug": option({
            identifiers: ["--debug"],
            description: "Logs debug information in logs.txt",
            type: t.compose(t.boolean(), t.optional(false))
        })
    }
})
export default run