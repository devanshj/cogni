import { State } from "./types";
import { splice, cyclicAdd } from "../../utils";
import { Reducer, flattenState } from "./utils";

export const cogniInputReducer: Reducer<State["cogniInput"]> =
	(state, event) => 
		(({
			cogniInput,
			cogniFeeds,
			focusedIndex,
			inputValue,
			inputCurPos
		}) => 
			event === "INPUT_CHANGE" ?
				{
					...cogniInput,
					feeds: splice(
						cogniFeeds,
						focusedIndex,
						1,
						inputValue
					)
				} :

			event === "INPUT_KEYDOWN_ENTER" ?
				{
					...cogniInput,
					feeds: splice(
						cogniFeeds,
						focusedIndex,
						1,
						inputValue.substring(0, inputCurPos),
						inputValue.substring(inputCurPos)
					)
				} :

			cogniInput
		)(flattenState(state));

export const focusedFeedIndexReducer: Reducer<State["focusedFeedIndex"]> =
	(state, event) =>
		(({ focusedIndex, cogniFeeds }) => 
			cyclicAdd(
				focusedIndex,
				event === "INPUT_KEYDOWN_DOWN" || event === "INPUT_KEYDOWN_ENTER" ? +1 :
				event === "INPUT_KEYDOWN_UP" ? -1 :
				0,
				cogniFeeds.length
			)
		)(flattenState(state));

export const inputFieldReducer: Reducer<State["inputField"]> =
	({ focusedFeedIndex, inputField }, event) => 
		event === "INPUT_KEYDOWN_ENTER" ?
			{
				...inputField,
				value: inputField.value.substring(0, focusedFeedIndex)
			}
		
		: inputField;
	