import { toState as toState } from "./state";

import { KeypressData, t as staermT } from "staerm";
import { Cogni } from "../core";

import { from, merge, Observable, of, Subject } from "rxjs";
import { distinctUntilChanged, filter, map, share, switchMap, withLatestFrom, delay, scan, mergeMap } from "rxjs/operators";
import { splice } from "../utils";

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

	const state$ = toState(
		cogniOutput$,
		keypress$
	);
	const staerm$ = state$.pipe(map(s => s.staerm));
	const staermText$ = staerm$.pipe(map(s => s.text));
	const stdinAreas$ = state$.pipe(map(s => s.stdinAreas));

	/* const focusedAreaIndex$ = staermInput$.pipe(
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
    
	const stdinAreas$ = merge(
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
		),
		keypress$.pipe(
			filter(k => k.sequence === "\r"),
			withLatestFrom(
				staermInput$.pipe(filter(notNull)),
				cogniOutput$.pipe(map(o => o.stdinAreas)),
				focusedAreaIndex$.pipe(filter(notNull))
			),
			map(([_, { length, caretOffset, position }, areas, fI]) => {
				logWithTag("got input")({ position, length, caretOffset });
				
				return areas.map((area, aI) =>
					aI < fI ? area :
					aI === fI ? { ...area, length: caretOffset } :
					aI === fI + 1  ? { ...area, length: length - caretOffset + 1 } :
					{ ...area, length: areas[aI - 1].length }
				)
			})
		)
	)*/
	
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