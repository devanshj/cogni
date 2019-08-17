import { Cogni } from "../../core";
import { toNavigation, toFocusedAreaIndex } from "./helpers";

import { Observable, merge } from "rxjs";
import { withLatestFrom, map, scan } from "rxjs/operators";
import { KeypressData, TerminalState, r as staermR } from "staerm";


export const toStaermState = (
	cogniOutput$: Observable<Cogni.Output>,
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