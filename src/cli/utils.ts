import { use } from "../utils";

export const padded =
	(...s: string[]) =>
		use(Math.min(process.stdout.columns || 80, 80))
		.as(wrapWidth => 
			s
			.join("\n")
			.split("\n")
			.flatMap(line => line
				.split(" ")
				.reduce(
					(lines, word) =>
						use(
							lines.slice(0,-1),
							lines.slice(-1)[0]
						).as((headLines, tailLine) =>
							tailLine === undefined
								? [...headLines, "  " + word]
								: (tailLine + " " + word).length <= wrapWidth
									? [...headLines, tailLine + " " + word]
									: [...headLines, tailLine, "  " + word]
						),
					[] as string[]
				)
			)
			.join("\n")
		);

export const lines = (...lines: string[]) => lines.join("\n");

export const brightCyan = (s: string) => "\u001B[96m" + s + "\u001B[39m";
export const grey = (s: string) => "\u001B[90m" + s + "\u001B[39m";
export const red = (s: string) => "\u001B[31m" + s + "\u001B[39m";
export const createStdout = (stdoutWrite: (data: string) => void) => ({
	print: (x: string = "") => stdoutWrite(padded(x)),
	println: (x: string = "") => stdoutWrite(padded(x) + "\n"),
	clear: () => stdoutWrite("\u001B[2J" + "\u001B[1;1H")
})
export const stdoutFromProcess =
	(process: NodeJS.Process) =>
		createStdout(s => process.stdout.write(s))