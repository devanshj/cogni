import { toState as toState } from "./state";

import { KeypressData, t as staermT } from "staerm";
import { Cogni } from "../core";

import { from, merge, Observable, of, Subject } from "rxjs";
import { distinctUntilChanged, filter, map, share, switchMap, withLatestFrom, delay, scan, mergeMap } from "rxjs/operators";
import { splice } from "../utils";

export const ui = (
	{ keypress$, refresh$, spawnProcess, toCogniOutput, allowEagerStdin = false }: {
		keypress$: Observable<KeypressData>,
		refresh$: Observable<true>,
		toCogniOutput: (input: Cogni.Input) => Promise<Cogni.Output>,
		spawnProcess: () => Promise<Cogni.Input["process"] | null>,
		allowEagerStdin?: boolean
	}
) => {
	
	const cogniInput$ = new Subject<Cogni.Input>();
	const cogniOutput$ = cogniInput$.pipe(
		switchMap(i => from(toCogniOutput(i))),
		share()
	);

	const state$ = toState({ cogniOutput$, keypress$ });
	const staerm$ = state$.pipe(map(s => s.staerm));
	const staermText$ = staerm$.pipe(map(s => s.text));
	const stdinAreas$ = state$.pipe(map(s => s.stdinAreas));
	
	const stdinFeeds$ = merge(
		staermText$.pipe(
			withLatestFrom(stdinAreas$),
			map(([text, areas]) =>
				areas.map(
					({ position: { x, y }, length }) =>
						staermT.slice(text, { x, y }, { x: x + length, y })
				)
			),
			scan((feeds, newFeeds) => 
				splice(
					feeds,
					0,
					newFeeds.length,
					...newFeeds
				)
			),
			distinctUntilChanged(
				(as, bs) =>
					as.length === bs.length &&
					as.every((a, i) => a === bs[i])
			)
		),
		of([] as string[]).pipe(delay(0))
	)

	stdinFeeds$.pipe(
		mergeMap(async feeds => ({
			feeds,
			process: await spawnProcess()
		})),
		filter((i): i is Cogni.Input => i.process !== null)
	).subscribe(cogniInput$);
	
	refresh$.pipe(
		withLatestFrom(stdinFeeds$),
		mergeMap(async ([_, feeds]) => ({
			feeds,
			process: await spawnProcess()
		})),
		filter((i): i is Cogni.Input => i.process !== null)
	).subscribe(cogniInput$);

	return staerm$;
}