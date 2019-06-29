import { fromEmitter } from "rxjs-from-emitter";
import { Observable, merge, race, timer } from "rxjs";
import { map, buffer, debounceTime, delayWhen, share } from "rxjs/operators";
import { ChildProcess } from "child_process";

import { Readable } from "stream";
import { CogniInput, NO_STDOUT_FALLBACK_TIMEOUT } from "../core";


export const STDOUT_BUFFER_DEBOUNCE_TIME = 50;



export const toCogniProcess = (childProcess: ChildProcess): CogniInput["process"] => {

    const fromDataStream = (stream: Readable) =>
        (fromEmitter(stream).eventStrict("data") as Observable<Buffer>).pipe(
            map(data => data.toString()),
            bufferDebounce(STDOUT_BUFFER_DEBOUNCE_TIME),
            map(chunks => chunks.reduce((a, b) => a + b, ""))
        )

    let stdout$ = fromDataStream(childProcess.stdout!).pipe(share());
    let stderr$ = fromDataStream(childProcess.stderr!).pipe(share());
    let exit$ = fromEmitter(childProcess).eventStrict("exit").pipe(map(([x]) => x!), share());

    let actualStdout$ = merge(stdout$, stderr$);
    
    return {
        exit$: exit$.pipe(
            delayWhen(() => race(
                actualStdout$,
                timer(NO_STDOUT_FALLBACK_TIMEOUT)
            ))
        ),
        stdout$: actualStdout$,
        stdinWrite: (data: string) => {
            try {
                childProcess.stdin!.write(data);
            } catch {
                throw "ERROR_STDIN_DESTROYED";
            }
        }
    };
}



const bufferDebounce = (time: number) =>
    <T>(source$: Observable<T>) =>
        source$.pipe(
            buffer(source$.pipe(
                debounceTime(time)
            ))
        );