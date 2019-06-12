import { State, Event } from "./types";
import { Observable } from "rxjs";

export type FlattenedState = {
	cogniInput: State["cogniInput"],
	cogniFeeds: State["cogniOutput"]["stdinFeeds"][number]["text"][],
	focusedIndex: State["focusedFeedIndex"],
	inputValue: State["inputField"]["value"],
	inputCurPos: State["inputField"]["caretPos"]
}

export const flattenState = ({
	cogniInput,
	cogniOutput: {
		stdinFeeds
	},
	focusedFeedIndex: focusedIndex,
	inputField: {
		value: inputValue,
		caretPos: inputCurPos
	}
}: State): FlattenedState => ({
	cogniInput,
	cogniFeeds: stdinFeeds.map(f => f.text),
	focusedIndex,
	inputValue, 
	inputCurPos
})

export type Reducer<T> = 
	(state: State, event: Event) => T

export type Saga<T> = 
	(sources: { state$: Observable<State>, event$: Observable<Event> }) => Observable<T>