import { terminal } from "terminal-kit";
export { terminal };

import EventEmitter from "nextgen-events";
declare module "terminal-kit" {
    namespace Terminal {
		type InputField = {
			abort: () => {},
			stop: () => {},
			getInput: () => string,
			getPosition: () => { x: number, y: number },
			getCursorPosition: () => number,
			setCursorPosition: (offset: number) => void,
			redraw: () => void,
			hide: () => void,
			show: () => void,
			rebase: (x: number, y: number) => void, 
			promise: Promise<string>,
		} & EventEmitter

        interface Impl {
            inputField(options: InputFieldOptions): InputField;
		}
    }
}

export const defaultInputKeyBindings = {
	ENTER: "submit",
	KP_ENTER: "submit",
	ESCAPE: "cancel",
	BACKSPACE: "backDelete",
	DELETE: "delete",
	LEFT: "backward",
	RIGHT: "forward",
	UP: "historyPrevious",
	DOWN: "historyNext",
	HOME: "startOfInput",
	END: "endOfInput",
	TAB: "autoComplete",
	CTRL_LEFT: "previousWord",
	CTRL_RIGHT: "nextWord",
	ALT_D: "deleteNextWord",
	CTRL_W: "deletePreviousWord",
	CTRL_U: "deleteAllBefore",
	CTRL_K: "deleteAllAfter"
}