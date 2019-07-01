import { toFocusedAreaIndex } from "./state/focused-area-index";
import { toStaermState } from "./state/staerm-state";

import { KeypressData, t as staermT } from "staerm";
import { CogniInput, CogniOutput } from "../core";

import { EMPTY, from, merge, Observable, of, Subject } from "rxjs";
import { distinctUntilChanged, filter, map, share, switchMap, withLatestFrom, delay } from "rxjs/operators";
import { areArrayEqual, notNull, splice } from "../utils";
import { watch } from "../testing/debug-observable";


export const ui = (
    { keypress$, refresh$, spawnProcess, toCogniOutput }: {
        keypress$: Observable<KeypressData>,
        refresh$: Observable<true>,
        toCogniOutput: (input: CogniInput) => Promise<CogniOutput>,
        spawnProcess: () => CogniInput["process"]
    }
) => {
	
	const cogniInput$ = new Subject<CogniInput>();
    const cogniOutput$ = cogniInput$.pipe(
        switchMap(i => from(toCogniOutput(i))),
        share()
    );
    watch(cogniOutput$, "cogniOutput$")

	const focusedAreaIndex$ = toFocusedAreaIndex(
		keypress$.pipe(
			switchMap(({ sequence }) =>
				sequence === "\u001b[A" ? of("UP" as const) :
				sequence === "\u001b[B" ? of("DOWN" as const) :
				sequence === "\r" ? of("DOWN" as const) :
				EMPTY
			)
		),
		cogniOutput$.pipe(map(o => o.stdinAreas.length))
    );

    const staerm$ = toStaermState(
        focusedAreaIndex$.pipe(filter(notNull)),
        cogniOutput$,
        keypress$
    );
    const staermInput$ = staerm$.pipe(map(s => s.input));
    const staermText$ = staerm$.pipe(map(s => s.text));

    const stdinAreas$ = staermInput$.pipe(
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
    );
    
    const stdinFeeds$ = merge(
        staermText$.pipe(
            withLatestFrom(stdinAreas$),
            map(([text, areas]) =>
                areas.map(
                    ({ position: { x, y }, length }) =>
                        staermT.slice(text, { x, y }, { x: x + length, y })
                )
            ),
            distinctUntilChanged(areArrayEqual)
        ),
        of([] as string[]).pipe(delay(0))
    )

    stdinFeeds$.pipe(
        map(feeds => ({
            feeds,
            process: spawnProcess()
        }))
    ).subscribe(cogniInput$);
    
    refresh$.pipe(
        withLatestFrom(stdinFeeds$),
        map(([_, feeds]) => ({
            feeds,
            process: spawnProcess()
        }))
    ).subscribe(cogniInput$);

    watch(staerm$, "staerm$");

    return staerm$;
}