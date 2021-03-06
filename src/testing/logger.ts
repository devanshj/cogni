import { appendFileSync, writeFileSync } from "fs";
import { join } from "path";

export function log(...things: any[]) {
	appendFileSync(
		join(process.cwd(), "./logs.txt"),
		things.map(thing =>
			typeof thing === "object"
				? JSON.stringify(thing, null, "  ")
				: thing
		).join(" ") + "\n"
	);
}

export const logWithTag =
	(tag: string) =>
		(...things: any[]) => log(tag, ":", ...things);

export function clear() {
	writeFileSync(join(process.cwd(), "./logs.txt"), "");
}