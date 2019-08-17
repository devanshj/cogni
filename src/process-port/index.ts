import { fromEmitter } from "rxjs-from-emitter";
import { Observable, merge, race, timer } from "rxjs";
import { map, buffer, debounceTime, delayWhen, share } from "rxjs/operators";
import { ChildProcess } from "child_process";

import { Readable } from "stream";
import { Cogni } from "../core";

export const toCogniProcess = (
	childProcess: ChildProcess,
	config: Partial<Config> = defaultConfig
): Cogni.Input["process"] => {
	let { 
		noStdoutFallbackTimeout,
		stdoutBufferDebounceTime
	} = { ...config, ...defaultConfig };

	const fromDataStream = (stream: Readable) =>
		(fromEmitter(stream).eventStrict("data") as Observable<Buffer>).pipe(
			map(data => data.toString()),
			bufferDebounce(stdoutBufferDebounceTime),
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
				timer(noStdoutFallbackTimeout)
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

const defaultConfig = {
	noStdoutFallbackTimeout: 500,
	stdoutBufferDebounceTime: 50
}
type Config = typeof defaultConfig;

const bufferDebounce = (time: number) =>
	<T>(source$: Observable<T>) =>
		source$.pipe(
			buffer(source$.pipe(
				debounceTime(time)
			))
		);