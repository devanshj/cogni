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

export const print = (x: string = "") => process.stdout.write(padded(x));
export const println = (x: string = "") => process.stdout.write(padded(x) + "\n");
export const clear = () => process.stdout.write("\u001B[2J" + "\u001B[1;1H");