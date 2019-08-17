import { Observable } from "rxjs";
import { log } from "./logger";

// const oldSub = Observable.prototype.subscribe;

export const watch = <T>($: Observable<T>, name: string) => {
	$.subscribe(x => log(name + ":", x));
	
	/*$.subscribe = (...args: any[]) => {
		log(name, "subscribed");
		return oldSub.bind($)(...args);
	}*/
}