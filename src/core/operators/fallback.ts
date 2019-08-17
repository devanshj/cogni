import { Observable, concat, merge, of, interval } from "rxjs";
import { switchMap, mapTo, takeUntil } from "rxjs/operators";

const takeUntilAny = <T>(until$: Observable<unknown>) =>
    (source$: Observable<T>): Observable<T> =>
        source$.pipe(
            takeUntil(new Observable(observer$ => {
                let subs = until$.subscribe({
                    next: x => observer$.next(),
                    complete: () => observer$.next(),
                    error: () => observer$.next()
                })

                return () => subs.unsubscribe();
            }))
        )

const takeUntilTerminate = <T>(until$: Observable<unknown>) =>
    (source$: Observable<T>): Observable<T> =>
        source$.pipe(
            takeUntil(new Observable(observer$ => {
                let subs = until$.subscribe({
                    complete: () => observer$.next(),
                    error: () => observer$.next()
                })

                return () => subs.unsubscribe();
            }))
        )

const fallback = <T, U>(fallbackValue: T, timeout: number) =>
    (source$: Observable<U>): Observable<U | T> =>
        merge(
            interval(timeout).pipe(
                mapTo(fallbackValue),
                takeUntilAny(source$)
            ),
            source$.pipe(
                switchMap(x => concat(
                    of(x),
                    interval(timeout).pipe(
                        mapTo(fallbackValue)
                    )
                )),
                takeUntilTerminate(source$)
            )
        )

export default fallback;