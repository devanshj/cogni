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