import { Observable, merge } from "rxjs";
import { KeypressData, TerminalState, r as staermR } from "staerm";
import { withLatestFrom, map, scan } from "rxjs/operators";
import { CogniOutput } from "../../core";

export const toStaermState = (
    focusedFeedIndex$: Observable<number>,
    cogniOutput$: Observable<CogniOutput>,
    keypress$: Observable<KeypressData>
) => 
    merge(
        focusedFeedIndex$.pipe(
            withLatestFrom(cogniOutput$),
            map(([i, o]): Reducer =>
                state => ({
                    ...state,
                    input: {
                        ...o.stdinAreas[i],
                        caretOffset: o.stdinAreas[i].length
                    }
                })
            )
        ),
        cogniOutput$.pipe(
            map((o): Reducer =>
                state => ({
                    ...state,
                    text: o.stdoutText
                })
            )
        ),
        keypress$.pipe(
            map((key): Reducer => 
                state => staermR.typing(state, key)
            )
        )
    ).pipe(
        scan(
            (state, reducer) => reducer(state),
            { text: "", input: null } as TerminalState
        )
    )

type Reducer = (state: TerminalState) => TerminalState;