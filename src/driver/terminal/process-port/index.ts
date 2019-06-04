import { fromEvent } from "rxjs-from-event-typed";
import { Observable, merge, race, timer } from "rxjs";
import { map, buffer, debounceTime, delayWhen } from "rxjs/operators";
import { ChildProcess } from "child_process";

import { CogniInput } from "../../../core/types";
import { NO_STDOUT_FALLBACK_TIMEOUT } from "../../../core";
import { Readable } from "stream";


export const STDOUT_BUFFER_DEBOUNCE_TIME = 50;



export const toCogniProcess = (childProcess: ChildProcess): CogniInput["childProcess"] => {

    const fromDataStream = (stream: Readable) => 
        (fromEvent(stream, "data") as Observable<Buffer>).pipe(
            map(data => data.toString()),
            bufferDebounce(STDOUT_BUFFER_DEBOUNCE_TIME),
            map(chunks => chunks.reduce((a, b) => a + b, ""))
        )

    let stdout$ = fromDataStream(childProcess.stdout!);
    let stderr$ = fromDataStream(childProcess.stderr!);
    let exit$ = fromEvent(childProcess, "exit").pipe(map(([x]) => x!));

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