import { t } from "staerm";

export const pty = {
	stdoutWrite: ({ text, curPos, stdinAreas }: TerminalState, data: string): TerminalState => ({
		text: t.splice(text, curPos, 0, data),
		curPos: p.reduceWithText(curPos, data),
		stdinAreas
	}),
	stdinWrite: ({ text, curPos, stdinAreas }: TerminalState, data: string): TerminalState =>
		pty.stdoutWrite({
			curPos,
			text,
			stdinAreas: [
				...stdinAreas,
				{
					position: curPos,
					length: data.length
				}
			]
		}, data)
};

const p = {
	reduceWithText:
		({ x, y }: { x: number, y: number }, text: string) => 
			(lines =>
				({
					y: lines.length === 1
						? y
						: y + (lines.length - 1),
					x: lines.length === 1
						? x + lines[0].length
						: lines.slice(-1)[0].length
				})
			)(text.split(/\n/g))
}

export type TerminalState = {
	text: string,
	curPos: { x: number, y: number },
	stdinAreas: Array<{
		position: { x: number, y: number },
		length: number
	}>
}