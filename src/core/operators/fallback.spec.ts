import fallback from "./fallback";
import { createScheduler } from "../../testing/rxjs";

describe("fallback operator", () => {

    it.each([{
        in$: " ----------|",
        out$: "---f--f--f|"
    }, {
        in$: " a----b----------c-----|",
        out$: "a--f-b--f--f--f-c--f--|"
    }])("works for case %#", ({ in$, out$ }) => {
        const run = createScheduler();
        run(({ hot, time, expectObservable }) => {
            let source$ = hot(in$);
            let expected$ = out$;
            let actual$ = source$.pipe(fallback("f", time("---|")))
    
            expectObservable(actual$).toBe(expected$);
        })
    })
})