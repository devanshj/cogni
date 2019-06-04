import { Observable, ReplaySubject, BehaviorSubject, NEVER, concat, NextObserver, ObservedValueOf, Subject } from "rxjs";
import { skip, take } from "rxjs/operators";

export const nexter = <T>(source$: Observable<T>) => {
    let n = 0;
    let replayed$ = new ReplaySubject<T>();
    source$.subscribe(replayed$);

    return () => replayed$.pipe(skip(n++), take(1)).toPromise();
}

export const toBehaviorSubject = <T>(source$: Observable<T>, initialValue: T) => {
    let data$ = new BehaviorSubject<T>(initialValue);

    let sourceSub = source$.subscribe({
        next: x => data$.next(x)
    });
    
    data$.subscribe({
        error: () => sourceSub.unsubscribe(),
        complete: () => sourceSub.unsubscribe()
    });

    return data$;
}


export const toReplaySubject = <T>(source$: Observable<T>) => {
    let data$ = new ReplaySubject<T>();

    let sourceSub = source$.subscribe({
        next: x => data$.next(x)
    });
    
    data$.subscribe({
        error: () => sourceSub.unsubscribe(),
        complete: () => sourceSub.unsubscribe()
    });

    return data$;
}


export const toSubject = <T>(source$: Observable<T>) => {
    let data$ = new Subject<T>();

    let sourceSub = source$.subscribe({
        next: x => data$.next(x)
    });
    
    data$.subscribe({
        error: () => sourceSub.unsubscribe(),
        complete: () => sourceSub.unsubscribe()
    });

    return data$;
}

export const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

export const toTag = <R>(fn: (v: string) => R) =>
    (literals: TemplateStringsArray, ...placeholders: string[]) => 
        fn(
            literals.reduce(
                (code, literal, i) =>
                    code + literal + (placeholders[i] || "")
                , ""
            )
        );

export const takeWithoutComplete =
    (n: number) =>
        <T>(source$: Observable<T>): Observable<T> =>
            concat(
                source$.pipe(take(n)),
                NEVER
            );

export const notNull = <T>(x: T): x is NonNullable<T> => x !== null
export const notNullDeep =
    <T>(x: T): x is { [K in keyof T]: NonNullable<T[K]> } =>
        Object.values(x).every(notNull);

export const splice = <T>(xs: T[], start: number, deleteCount: number, ...ixs: T[]) => {
    xs = [...xs];
    xs.splice(start, deleteCount, ...ixs);
    return xs;
}

export type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;

export const unzip = <Sinks extends Array<NextObserver<any>>>(...sinks: Sinks) => 
    (nexts: { [K in keyof Sinks]: ObservedValueOf<Sinks[K]> }) => 
        sinks.forEach((sink$, i) => sink$.next(nexts[i]))

