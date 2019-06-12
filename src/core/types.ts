import { Observable } from "rxjs";

export type CogniOutput = {
	stdoutText: string,
	stdinFeeds: Array<{
		text: string,
		pos: {
			x: number,
			y: number
		}
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