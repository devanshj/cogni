import { toStaermText } from "./staerm-text";
import { Subject, BehaviorSubject } from "rxjs";
import { StaermInput } from "./staerm-input";
import { KeypressData } from "staerm";
import { toBehaviorSubject } from "../../utils";

describe("staermText$", () => {
    it("works", () => {
        const cogniText$ = new Subject<string>();
        const staermInput$ = new Subject<StaermInput>();
        const keypress$ = new Subject<KeypressData>();
        const staermText$ = toBehaviorSubject(toStaermText(cogniText$, staermInput$, keypress$), undefined);

        cogniText$.next("");
        staermInput$.next({
            position: { x: 0, y: 0 },
            length: 0,
            caretOffset: 0
        });
        expect(staermText$.value).toBe("");

        keypress$.next(key("a"));
        staermInput$.next({
            position: { x: 0, y: 0 },
            length: 1,
            caretOffset: 1
        });
        expect(staermText$.value).toBe("a");

        keypress$.next(KEY_LEFT);
        staermInput$.next({
            position: { x: 0, y: 0 },
            length: 1,
            caretOffset: 0
        });
        expect(staermText$.value).toBe("a");

        keypress$.next(KEY_DELETE);
        staermInput$.next({
            position: { x: 0, y: 0 },
            length: 0,
            caretOffset: 0
        });
        expect(staermText$.value).toBe("");
    })
});

const key = (sequence: string) => ({
    sequence,
    ctrl: false,
    shift: false,
    meta: false
})
const KEY_LEFT = key("\u001b[D");
const KEY_DELETE = key("\u001b[3~");