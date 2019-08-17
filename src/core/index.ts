import { Subject, merge } from "rxjs";
import { scan, map, takeUntil, delay, mapTo } from "rxjs/operators";
import { toBehaviorSubject } from "../utils";

import { Cogni } from "./types";
import fallback from "./operators/fallback";
import { TerminalState, pty } from "./pty";


export const toCogniOutput = (
	{ process, feeds }: Cogni.Input,
	config: Partial<Cogni.Config> = defaultConfig
): Promise<Cogni.Output> => {
	let { noStdoutFallbackTimeout } = { ...config, ...defaultConfig };
	let { exit$, stdout$, stdinWrite } = process;
	

	let didExit$ = toBehaviorSubject(exit$.pipe(mapTo(true)), false);
	let noStdinAreas$ = new Subject<true>();
	feeds = [...feeds];

	return stdout$.pipe(
		fallback(null, noStdoutFallbackTimeout),
		map(x => x === null ? "" : x),
		scan(
			(term: TerminalState, data: string) => {

				term = pty.stdoutWrite(term, data);

				let nextFeed = feeds.shift();
				if (nextFeed) {
					if (!didExit$.value) {
						let writeSuccessful = true;
						try {
							stdinWrite(nextFeed + "\n");
						} catch {
							noStdinAreas$.next(true);
							writeSuccessful = false	 
						}
						if (writeSuccessful) {
							term = pty.stdinWrite(term, nextFeed);
							term = pty.stdoutWrite(term, "\n");
						}
					}
				} else {
					noStdinAreas$.next(true);
				}

				return term;
			}, {
				text: "",
				curPos: { x: 0, y: 0 },
				stdinAreas: []
			} as TerminalState
		),
		takeUntil(merge(
			exit$,
			noStdinAreas$.pipe(delay(noStdoutFallbackTimeout))
		))
	)
	.toPromise()
	.then(term => {
		didExit$.complete();

		if (!didExit$.value) {
			term = pty.stdinWrite(term, "");
		}

		return Promise.resolve({
			stdoutText: term.text,
			stdinAreas: term.stdinAreas,
			didExit: didExit$.value
		});
	});
}

export const defaultConfig = {
	noStdoutFallbackTimeout: 500
}


export * from "./types";