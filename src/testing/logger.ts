import { writeFile, appendFile } from "fs";
import { join } from "path";
import { format } from "util";

export function log(...things: any[]) {
	appendFile(
		join(process.cwd(), "./logs.txt"),
		things.map(thing =>
			typeof thing === "object"
				? JSON.stringify(thing, null, "  ")
				: thing
		).join(" ") + "\n",
		() => {}
	);
}

export const logWithTag =
	(tag: string) =>
		(...things: any[]) => log(tag, ":", ...things);

export function clear() {
	writeFile(join(process.cwd(), "./logs.txt"), "", () => {});
}