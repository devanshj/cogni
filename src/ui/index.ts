import { toStaermState } from "./state/staerm-state";

import { KeypressData, t as staermT } from "staerm";
import { Cogni } from "../core";

import { from, merge, Observable, of, Subject } from "rxjs";
import { distinctUntilChanged, filter, map, share, switchMap, withLatestFrom, delay, scan, mergeMap } from "rxjs/operators";
import { notNull, splice } from "../utils";


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

	/*const focusedAreaIndex$ = toFocusedAreaIndex(
		keypress$.pipe(
			switchMap(({ sequence }) =>
				sequence === "\u001b[A" ? of("UP" as const) :
				sequence === "\u001b[B" ? of("DOWN" as const) :
				// sequence === "\r" ? of("DOWN" as const) :
				EMPTY
			)
		),
		cogniOutput$.pipe(map(o => o.stdinAreas.length))
	);*/

	const staerm$ = toStaermState(
		cogniOutput$,
		keypress$
	);
	const staermInput$ = staerm$.pipe(map(s => s.input));
	const staermText$ = staerm$.pipe(map(s => s.text));

	const focusedAreaIndex$ = staermInput$.pipe(
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
		staermInput$.pipe(
			filter(notNull),
			withLatestFrom(
				cogniOutput$.pipe(map(o => o.stdinAreas)),
				focusedAreaIndex$.pipe(filter(notNull))
			),
			map(([{ position, length }, areas, i]) =>
				splice(
					areas,
					i,
					1,
					{ position, length }
				)
			)
		)
	
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