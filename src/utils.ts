import { Observable, BehaviorSubject } from "rxjs";

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

export const notNull = <T>(x: T): x is Exclude<T, null> => x !== null
export const notUndefined = <T>(x: T): x is Exclude<T, undefined> => x !== undefined

export const splice = <T>(xs: T[], start: number, deleteCount: number, ...ixs: T[]) => {
	xs = [...xs];
	xs.splice(start, deleteCount, ...ixs);
	return xs;
}

export const assertType =
	<T>() =>
		($: Observable<any>): Observable<T> => $

export const use =
	<A extends any[]>(...args: A) =>
		({ as: <R>(fn: (...args: A) => R) =>
			fn(...args) })

export const isDebugEnv = () => process.argv.includes("--debug")

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

export const getIndex =
	<T>(i: number, a: T[]) =>
		a[i] as T | undefined;