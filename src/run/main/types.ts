import { CogniOutput, CogniInput } from "../../core";
import { Observable } from "rxjs";

export type State = {
	cogniInput: CogniInput,
	cogniOutput: CogniOutput,
	focusedFeedIndex: number,
	inputField: {
		pos: { x: number, y: number },
		value: string,
		caretPos: number
	}
};

export type Event = 
	| "INPUT_CHANGE"
	| "INPUT_KEYDOWN_ENTER"
	| "INPUT_KEYDOWN_DOWN"
	| "INPUT_KEYDOWN_UP";

export type Sources = {
	ui: {
		event$: Observable<Event>,
		inputField$: Observable<State["inputField"]>
	},
	cogni: {
		spawn: () => CogniInput["process"],
		outputFor: (i: CogniInput) => Promise<CogniOutput>
	},
	external: {
		refresh$: Observable<never>
	}
};

export type Sinks = {
	ui: Observable<{
		inputField: State["inputField"],
		stdout: {
			text: State["cogniOutput"]["stdoutText"],
			feeds: State["cogniOutput"]["stdinFeeds"]
		}
	}>
}