import { Observable, of, EMPTY, combineLatest } from "rxjs";
import { KeypressData } from "staerm";
import { switchMap, withLatestFrom, filter, map, startWith, scan, distinctUntilChanged } from "rxjs/operators";


export const toNavigation =
    () =>
        (keypress$: Observable<KeypressData>) =>
            keypress$.pipe(
                switchMap(({ sequence }) =>
                    sequence === "\u001b[A" ? of("UP" as const) :
                    sequence === "\u001b[B" ? of("DOWN" as const) :
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