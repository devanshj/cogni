import { Subject, of } from "rxjs";
import { KeypressData } from "staerm";
import { toFocusedAreaIndex } from "./focused-area-index";
import { toBehaviorSubject, nexter } from "../../utils";
import { delay } from "rxjs/operators";

describe("focusedAreaIndex", () => {

    it("increments & decrements", () => {
        
        const navigation$ = new Subject<"UP" | "DOWN">();
        const areasLength$ = new Subject<number>();
        const focusedAreaIndex$ = toBehaviorSubject(toFocusedAreaIndex(navigation$, areasLength$), undefined);

        areasLength$.next(3);
        expect(focusedAreaIndex$.value).toBe(0);

        navigation$.next("UP");
        expect(focusedAreaIndex$.value).toBe(2);

        navigation$.next("DOWN");
        navigation$.next("DOWN");
        expect(focusedAreaIndex$.value).toBe(1);

        navigation$.next("DOWN");
        expect(focusedAreaIndex$.value).toBe(2);
    })

    it("is null if there are no feeds", () => {
        const navigation$ = new Subject<"UP" | "DOWN">();
        const areasLength$ = new Subject<number>();
        const focusedAreaIndex$ = toBehaviorSubject(toFocusedAreaIndex(navigation$, areasLength$), undefined);

        areasLength$.next(0);
        expect(focusedAreaIndex$.value).toBe(null);

        navigation$.next("UP");
        expect(focusedAreaIndex$.value).toBe(null);
    })

    it("adjusts to new feedLength", () => {
        const navigation$ = new Subject<"UP" | "DOWN">();
        const areasLength$ = new Subject<number>();
        const focusedAreaIndex$ = toBehaviorSubject(toFocusedAreaIndex(navigation$, areasLength$), undefined);

        areasLength$.next(0);
        expect(focusedAreaIndex$.value).toBe(null);

        navigation$.next("DOWN");

        areasLength$.next(3);
        expect(focusedAreaIndex$.value).toBe(0);

        navigation$.next("DOWN");
        expect(focusedAreaIndex$.value).toBe(1);

        areasLength$.next(2);
        expect(focusedAreaIndex$.value).toBe(1);

        areasLength$.next(1);
        expect(focusedAreaIndex$.value).toBe(0);

        areasLength$.next(0);
        expect(focusedAreaIndex$.value).toBe(null);
    })

    it("doesn't emit for same values", async () => {
        const navigation$ = new Subject<"UP" | "DOWN">();
        const areasLength$ = new Subject<number>();
        const focusedAreaIndex = nexter(toFocusedAreaIndex(navigation$, areasLength$));

        areasLength$.next(0);
        expect(await focusedAreaIndex()).toBe(null);

        areasLength$.next(0);
        expect(
            await Promise.race([
                focusedAreaIndex(),
                of("no-emit").pipe(delay(500)).toPromise()
            ])
        ).toBe("no-emit");
    })
});

const key = (sequence: string): KeypressData => ({
    sequence,
    ctrl: false,
    meta: false,
    shift: false
});
const KEY_UP = key("\u001b[A");
const KEY_DOWN = key("\u001b[B");