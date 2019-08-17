import { toStaermState } from "./state/staerm-state";

import { KeypressData, t as staermT } from "staerm";
import { Cogni } from "../core";

import { from, merge, Observable, of, Subject, combineLatest } from "rxjs";
import { distinctUntilChanged, filter, map, share, switchMap, withLatestFrom, delay, scan, mergeMap, tap } from "rxjs/operators";
import { notNull, splice, isDebugEnv } from "../utils";
import { watch } from "../testing/debug-observable";
import { log } from "../testing/logger";


export const ui = (
	{ keypress$, refresh$, spawnProcess, toCogniOutput }: {
		keypress$: Observable<KeypressData>,
		refresh$: Observable<true>,
		toCogniOutput: (input: Cogni.Input) => Promise<Cogni.Output>,
		spawnProcess: () => Promise<Cogni.Input["process"] | null>
	}
) => {
	
	const cogniInput$ = new Subject<Cogni.Input>();
	const cogniOutput$ = cogniInput$.pipe(
		switchMap(i => from(toCogniOutput(i))),
		share()
	);

	const staerm$ = toStaermState(
		cogniOutput$,
		keypress$
	);
	const staermInput$ = staerm$.pipe(map(s => s.input));
	const staermText$ = staerm$.pipe(map(s => s.text));

	
	watch(staermText$, "staermText$");

	const focusedAreaIndex$ = 
		staermInput$.pipe(
			withLatestFrom(
				cogniOutput$.pipe(map(o => o.stdinAreas))
			),
			map(([input, areas]) =>
			input === null
				? null
				: areas.findIndex(
					({ position: { x, y } }) =>
						input.position.x === x &&
						input.position.y === y
				)
		)
	);

	const stdinAreas$ = 
		cogniOutput$.pipe(
			map(o => o.stdinAreas),
			switchMap(areas => 
				merge(
					of(areas),
					staermInput$.pipe(
						filter(notNull),
						withLatestFrom(
							focusedAreaIndex$.pipe(
								filter(notNull)
							)
						),
						map(([{ position, length }, i]) =>
							splice(
								areas,
								i,
								1,
								{ position, length }
							)
						)
					)
				)
			)
		)
		
	watch(stdinAreas$, "stdinAreas$");
	
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
					(log(as, bs),
					as.length === bs.length &&
					as.every((a, i) => a === bs[i]))
			)
		),
		of([] as string[]).pipe(delay(0))
	)
	
	watch(stdinFeeds$, "stdinFeeds$");

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