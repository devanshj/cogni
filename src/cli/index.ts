import mri from "mri";
import { ui } from "../ui";
import { terminal, withNodeProcess } from "staerm";
import { Observable } from "rxjs";
import { toCogniProcess } from "../process-port";
import { spawn } from "child_process";
import { toCogniOutput } from "../core";
import chokidar from "chokidar";
import { emitKeypressEvents } from "readline";

if (process.stdin.isTTY) {
    let {
        _: [spawnCmd, ...spawnArgs],
        watch: watchGlob,
        help: showHelp
    } = mri(process.argv.slice(2));

    if (spawnCmd === undefined || showHelp) {
        console.log([
            `cogni-cli [...execArgs] --watch [watchFileGlob]`,
            `Examples:`,
            `   cogni-cli python main.py --watch main.py`,
            `   cogni-cli python src/main.py --watch src/**/*`,
            `   cogni-cli sh build-and-run.sh --watch main.c`
        ].join("\n"))
    } else {
        process.stdin.setRawMode!(true);
        emitKeypressEvents(process.stdin);
        let { state, io } = withNodeProcess(terminal(), process);
        
        ui({
            keypress$: new Observable($ => {
                io.keypress.listen(
                    k => $.next(k)
                )
            }),
            spawnProcess: () => toCogniProcess(spawn(spawnCmd, spawnArgs)),
            refresh$: new Observable($ => {
                chokidar.watch(watchGlob).on(
                    "change",
                    () => $.next(true)
                )
            }),
            toCogniOutput
        }).subscribe(state.set)
    }
} else {
    console.log("You are not in a interactive shell :(");
}
