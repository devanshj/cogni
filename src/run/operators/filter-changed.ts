import { Observable, merge } from "rxjs";
import { skip, pairwise, filter, map, take } from "rxjs/operators";

export const unchanged =
    <T>(didChange: (a: T, b: T) => boolean = (a, b) => a !== b) =>
        (source$: Observable<T>) =>
            merge(
                source$.pipe(take(1)),
                source$.pipe(
                    skip(1),
                    pairwise(),
                    filter(([a,b]) => !didChange(a, b)),
                    map(([_,b]) => b)
                )
            )