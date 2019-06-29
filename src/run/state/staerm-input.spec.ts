import { toStaermInput, StdinAreas } from "./staerm-input";
import { Subject } from "rxjs";
import { KeypressData } from "staerm";
import { toBehaviorSubject, nexter } from "../../utils";


describe("staermInput$", () => {

    it("reacts to focusedAreaIndex$ with latest stdinAreas$", () => {
        const focusedAreaIndex$ = new Subject<number | null>();
        const stdinAreas$ = new Subject<StdinAreas>();
        const keypress$ = new Subject<KeypressData>();
        const staermInput$ = toBehaviorSubject(toStaermInput(focusedAreaIndex$, stdinAreas$, keypress$), undefined);
        

        stdinAreas$.next([{
            position: { x: 0, y: 0 },
            length: 0
        }]);
        focusedAreaIndex$.next(null);
        expect(staermInput$.value).toBe(null);

        focusedAreaIndex$.next(0);
        expect(staermInput$.value).toStrictEqual({
            position: { x: 0, y: 0 },
            length: 0,
            caretOffset: 0
        });

        keypress$.next(key("a"));
        expect(staermInput$.value).toStrictEqual({
            position: { x: 0, y: 0 },
            length: 1,
            caretOffset: 1
        });

        keypress$.next(KEY_LEFT);
        expect(staermInput$.value).toStrictEqual({
            position: { x: 0, y: 0 },
            length: 1,
            caretOffset: 0
        });

        keypress$.next(KEY_DELETE);
        expect(staermInput$.value).toStrictEqual({
            position: { x: 0, y: 0 },
            length: 0,
            caretOffset: 0
        });

        stdinAreas$.next([{
            position: { x: 0, y: 1 },
            length: 2
        }]);
        expect(staermInput$.value).toStrictEqual({
            position: { x: 0, y: 0 },
            length: 0,
            caretOffset: 0
        });
    })

    it("resets even if focusedAreaIndex is same as before", async () => {
        const focusedAreaIndex$ = new Subject<number | null>();
        const stdinAreas$ = new Subject<StdinAreas>();
        const keypress$ = new Subject<KeypressData>();
        const staermInput = nexter(toStaermInput(focusedAreaIndex$, stdinAreas$, keypress$));
        

        focusedAreaIndex$.next(null);
        stdinAreas$.next([{
            position: { x: 0, y: 0 },
            length: 2
        }]);

        focusedAreaIndex$.next(0);
        expect(await staermInput()).toStrictEqual({
            position: { x: 0, y: 0},
            length: 2,
            caretOffset: 2
        });

        keypress$.next(KEY_LEFT);
        expect(await staermInput()).toStrictEqual({
            position: { x: 0, y: 0},
            length: 2,
            caretOffset: 1
        });
        
        focusedAreaIndex$.next(0);
        expect(await staermInput()).toStrictEqual({
            position: { x: 0, y: 0 },
            length: 2,
            caretOffset: 2
        });
    })
})

const key = (sequence: string) => ({
    sequence,
    ctrl: false,
    shift: false,
    meta: false
})
const KEY_LEFT = key("\u001b[D");
const KEY_DELETE = key("\u001b[3~");