import { Observable } from "rxjs";

export type CogniOutput = {
	stdoutText: string,
	stdinAreas: Array<{
		position: {
			x: number,
			y: number
		},
		length: number
	}>,
	didExit: boolean
}

export type CogniInput = {
	process: {
		stdout$: Observable<string>,
		stdinWrite: (data: string) => void,
		exit$: Observable<number>
	},
	feeds: Array<string>
}