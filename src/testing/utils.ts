import { Observable, ReplaySubject } from "rxjs";
import { skip, take } from "rxjs/operators";

export const nexter = <T>(source$: Observable<T>) => {
	let n = 0;
	let replayed$ = new ReplaySubject<T>();
	source$.subscribe(replayed$);

	return () => replayed$.pipe(skip(n++), take(1)).toPromise();
}
