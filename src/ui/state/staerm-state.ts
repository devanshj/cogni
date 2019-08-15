import { Observable, merge, EMPTY, of } from "rxjs";
import { KeypressData, TerminalState, r as staermR, t as staermT } from "staerm";
import { withLatestFrom, map, scan, filter, delay, switchMap } from "rxjs/operators";
import { CogniOutput } from "../../core";
import { splice, notNull } from "../../utils";
import { toNavigation, toFocusedAreaIndex } from "./helpers";

export const toStaermState = (
    cogniOutput$: Observable<CogniOutput>,
    keypress$: Observable<KeypressData>
) => 
    merge(
        keypress$.pipe(
            toNavigation(),
            toFocusedAreaIndex(
                cogniOutput$.pipe(map(o => o.stdinAreas.length))
            ),
            withLatestFrom(cogniOutput$.pipe(map(o => o.stdinAreas))),
            map(([i, as]): Reducer =>
                state => 
                    ({
                        ...state,
                        input: 
                            i === null
                                ? null
                                : {
                                    ...as[i],
                                    caretOffset: as[i].length
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
    );

type Reducer = (state: TerminalState) => TerminalState;