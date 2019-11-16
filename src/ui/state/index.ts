import { Cogni } from "../../core";
import { toNavigation, toFocusedAreaIndex } from "./helpers";

import { Observable, merge } from "rxjs";
import { withLatestFrom, map, scan, filter } from "rxjs/operators";
import { KeypressData, TerminalState, r as staermR } from "staerm";
import { use, splice } from "../../utils";


export const toState = (
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
				map((i): Reducer =>
					({ staerm, stdinAreas }) => ({
						staerm: {
							...staerm,
							input: 
								i === null || stdinAreas[i] === undefined
									? null
									: {
										...stdinAreas[i],
										caretOffset: stdinAreas[i].length
									}
						},
						stdinAreas
					})
				)
			),
			cogniOutput$.pipe(
				withLatestFrom(focusedAreaIndex$),
				map(([{ stdoutText, stdinAreas }, i]): Reducer =>
					({ staerm: { input } }) => ({
						staerm: {
							input:
								i === null
									? null
									: use(stdinAreas[
										i % stdinAreas.length
									]).as(area =>
										area
											? {
												...area,
												caretOffset: input ? input.caretOffset : 0
											}
											: null
									),
							text: stdoutText
						},
						stdinAreas: stdinAreas
					})
				)
			),
			keypress$.pipe(
				filter(k => !["\r", "\u001b[A", "\u001b[B"].includes(k.sequence)),
				withLatestFrom(focusedAreaIndex$),
				map(([key, i]): Reducer => 
					({ staerm, stdinAreas }) => 
						use(staermR.typing(staerm, key))
						.as(staerm =>
							({
								staerm,
								stdinAreas:
									staerm.input === null || i === null
										? stdinAreas
										: splice(
											stdinAreas,
											i,
											1,
											staerm.input
										)
							})
						)
				)
			)/*,
			keypress$.pipe(
				filter(k => k.sequence === "\r"),
				withLatestFrom(
					cogniOutput$.pipe(map(o => o.stdinAreas)),
					focusedAreaIndex$.pipe(filter(notNull))
				),
				map(([_, areas, i]): Reducer => ({ text, input }) =>
					input === null
						? { text, input }
						: use(toStdinFeeds(text, areas)).as(feeds =>
							({
								text: toText(
									splice(
										feeds,
										i,
										2,
										feeds[i].substring(0, input.caretOffset),
										feeds[i].substring(input.caretOffset)
									),
									text,
									areas
								),
								input: {
									position: areas[i + 1].position,
									caretOffset: 0,
									length: input.caretOffset
								}
							})
						)
				)
			)*/
		).pipe(
			scan(
				(state, reducer) => reducer(state),
				{ staerm: { text: "", input: null }, stdinAreas: [] } as State
			)
		)
	);

const cyclicAdd = (x: number, m: number) => (x + m) % m;

type State = { staerm: TerminalState, stdinAreas: Cogni.Output["stdinAreas"] };
type Reducer = (state: State) => State;