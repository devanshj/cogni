import { Observable } from "rxjs";
import { KeypressData, r as staerm } from "staerm";
import { switchMap, startWith, scan, withLatestFrom, tap } from "rxjs/operators";
import { StaermInput } from "./staerm-input";
import { toBehaviorSubject } from "../../utils";
import { log } from "../../testing/logger";

export const toStaermText =
    (
        cogniText$: Observable<string>,
        staermInput$: Observable<StaermInput>,
        keypress$: Observable<KeypressData>
    ) => {
        const input$ = toBehaviorSubject(staermInput$, null); // TODO: avoid

        return cogniText$.pipe(
            switchMap(text =>
                keypress$.pipe(
                    tap(() => log("input = ", input$.value)),
                    scan(
                        (text, key) =>
                            staerm
                            .typing({ text, input: input$.value }, key)
                            .text,
                        text
                    ),
                    startWith(text)
                )
            )
        );
    }
        