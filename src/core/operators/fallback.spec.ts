import fallback from "./fallback";
import { createScheduler } from "../../testing/rxjs";

describe("cogni-core/fallback-operator", () => {

	it.each([{
		in$:	 "----------|",
		timeout: "---|",
		out$:	"---f--f--f|"
	}, {
		in$:	 "a----b----------c-----|",
		timeout: "---|",
		out$:	"a--f-b--f--f--f-c--f--|"
	}])("works for case %#", ({ in$, out$, timeout }) => {
		const run = createScheduler();
		run(({ hot, time, expectObservable }) => {
			let source$ = hot(in$);
			let expected$ = out$;
			let actual$ = source$.pipe(fallback("f", time(timeout)))
	
			expectObservable(actual$).toBe(expected$);
		})
	})
})