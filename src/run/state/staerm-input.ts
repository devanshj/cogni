import { Observable, merge } from "rxjs";
import { CogniOutput } from "../../core";
import { withLatestFrom, map, switchMap, scan, startWith, pairwise, distinctUntilChanged, tap, share, delay } from "rxjs/operators";
import { TerminalState, KeypressData, r } from "staerm";
import { log, logWithTag } from "../../testing/logger";


export const toStaermInput =
    (
        focusedAreaIndex$: Observable<number | null>,
        stdinAreas$: Observable<StdinAreas>,
        keypress$: Observable<KeypressData>
    ) =>
        focusedAreaIndex$.pipe(
            withLatestFrom(stdinAreas$),
            map(([i, areas]) => 
                i === null
                    ? null
                    : (({ position, length }) =>
                        ({
                            position,
                            length,
                            caretOffset: length
                        }) as StaermInput
                    )(areas[i])
            ),
            switchMap(input =>
                keypress$.pipe(
                    scan(typingReducer, input),
                    startWith(input)
                )
            ),
            delay(0) // TODO: avoid
        );

const typingReducer =
    (input: StaermInput, key: KeypressData) =>
        r.typing({ text: "", input }, key).input

export type StdinAreas = CogniOutput["stdinAreas"];
export type StaermInput = TerminalState["input"];