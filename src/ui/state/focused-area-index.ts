import { Observable, combineLatest } from "rxjs";
import { map, scan, withLatestFrom, filter, startWith, distinctUntilChanged } from "rxjs/operators";

export const toFocusedAreaIndex =
    (navigation$: Observable<"UP" | "DOWN">, areasLength$: Observable<number>) =>
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