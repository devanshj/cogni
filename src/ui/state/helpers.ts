import { KeypressData, t as staermT } from "staerm";
import { Observable, of, EMPTY, combineLatest } from "rxjs";
import { switchMap, withLatestFrom, filter, map, startWith, scan, distinctUntilChanged } from "rxjs/operators";
import { Cogni } from "../../core";
import { use, getIndex } from "../../utils";

export const toNavigation =
	() =>
		(keypress$: Observable<KeypressData>) =>
			keypress$.pipe(
				switchMap(({ sequence }) =>
					sequence === "\u001b[A" ? of("UP" as const) :
					sequence === "\u001b[B" || sequence === "\r" ? of("DOWN" as const) :
					EMPTY
				)
			);

export const toFocusedAreaIndex =
	(areasLength$: Observable<number>) =>
		(navigation$: Observable<"UP" | "DOWN">) =>
			combineLatest(
				navigation$.pipe(
					withLatestFrom(areasLength$),
					filter(([_, m]) => m !== 0),
					map(([i, _]) => i),
					map(dir =>
						dir === "UP" ? -1 :
						dir === "DOWN" ? +1 :
						0
					),
					startWith(0),
					scan((i, a) => i + a),
				),
				areasLength$
			).pipe(
				map(([i, m]) => m === 0 ? null : (i + m) % m),
				distinctUntilChanged()
			);

export const toStdinFeeds =
	(text: string, areas: Cogni.Output["stdinAreas"]) =>
		areas.map(({ position: { x, y }, length }) =>
			staermT.slice(text, { x, y }, { x: x + length, y })
		)

export const toText =
	(feeds: string[], initialText: string, areas: Cogni.Output["stdinAreas"]) =>
		feeds
		.map((value, i) => 
			use(getIndex(i, areas)).as(area =>
				area === undefined
					? null
					: ({ value, ...area })
			)
		)
		.reduce((text, area) =>
			area === null
				? text
				: use(area).as(({ value, position, length }) =>
					staermT.splice(
						text,
						position,
						length,
						value
					)	
				),
			initialText
		)