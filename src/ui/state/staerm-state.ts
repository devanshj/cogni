import { Cogni } from "../../core";
import { toNavigation, toFocusedAreaIndex } from "./helpers";

import { Observable, merge } from "rxjs";
import { withLatestFrom, map, scan, filter } from "rxjs/operators";
import { KeypressData, TerminalState, r as staermR } from "staerm";
import { use, notNull } from "../../utils";


export const toStaermState = (
	cogniOutput$: Observable<Cogni.Output>,
	keypress$: Observable<KeypressData>
) => 
	use(
		keypress$.pipe(
			toNavigation(),
			toFocusedAreaIndex(
				cogniOutput$.pipe(map(o => o.stdinAreas.length))
			)
		)
	).as(focusedAreaIndex$ =>
		merge(
			focusedAreaIndex$.pipe(
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
				withLatestFrom(
					focusedAreaIndex$.pipe(
						filter(notNull)
					)
				),
				map(([o, i]): Reducer =>
					state => ({
						input: use(o.stdinAreas[
							i % o.stdinAreas.length
						]).as(area =>
							area
								? {
									...area,
									caretOffset:
										state.input
											? state.input.caretOffset
											: 0
								}
								: null
						),
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
	);

const cyclicAdd = (x: number, m: number) => (x + m) % m;

type Reducer = (state: TerminalState) => TerminalState;