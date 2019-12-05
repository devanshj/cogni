import { Cogni } from "../../core";

import { Observable, merge, EMPTY, of } from "rxjs";
import { map, scan, filter, switchMap, withLatestFrom } from "rxjs/operators";
import { KeypressData, TerminalState, r as staermR } from "staerm";
import { use, splice } from "../../utils";


export const toState = ({ cogniOutput$, keypress$ }: {
	cogniOutput$: Observable<Cogni.Output>,
	keypress$: Observable<KeypressData>
}) => 
	merge(
		keypress$.pipe(
			switchMap(({ sequence }) =>
				sequence === "\u001b[A" ? of("UP" as const) :
				sequence === "\u001b[B" || sequence === "\r" ? of("DOWN" as const) :
				EMPTY
			),
			map((direction): Reducer =>
				({ staerm, stdinAreas, focusedIndex }) =>
					use(
						focusedIndex === null
							? null
							: focusedIndex + (
								direction === "UP" ? -1 :
								direction === "DOWN" ? +1 :
								0
							)
					).as(focusedIndex =>
						({
							staerm: {
								...staerm,
								input: 
									focusedIndex === null || stdinAreas[focusedIndex] === undefined
										? null
										: {
											...stdinAreas[focusedIndex],
											caretOffset: stdinAreas[focusedIndex].length
										}
							},
							stdinAreas,
							focusedIndex
						})
					)
			)
		),
		cogniOutput$.pipe(
			map(({ stdoutText, stdinAreas }): Reducer =>
				({ staerm: { input }, focusedIndex }) => ({
					staerm: {
						input:
							focusedIndex === null
								? null
								: use(stdinAreas[
									focusedIndex % stdinAreas.length
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
					stdinAreas,
					focusedIndex:
						stdinAreas.length === 0
							? null
							: focusedIndex !== null
								? focusedIndex % stdinAreas.length
								: null
				})
			)
		),
		keypress$.pipe(
			filter(k => !["\r", "\u001b[A", "\u001b[B"].includes(k.sequence)),
			map((key): Reducer => 
				({ staerm, stdinAreas, focusedIndex }) => 
					use(staermR.typing(staerm, key))
					.as(staerm =>
						({
							staerm,
							stdinAreas:
								staerm.input === null || focusedIndex === null
									? stdinAreas
									: splice(
										stdinAreas,
										focusedIndex,
										1,
										staerm.input
									),
							focusedIndex
						})
					)
			)
		)
	).pipe(
		scan(
			(state, reducer) =>
				reducer(state),
			{
				staerm: { text: "", input: null },
				stdinAreas: [],
				focusedIndex: 0
			} as State
		)
	);

type State = {
	staerm: TerminalState,
	stdinAreas: Cogni.Output["stdinAreas"],
	focusedIndex: number | null
};
type Reducer = (state: State) => State;