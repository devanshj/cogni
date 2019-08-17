import { appendFileSync, writeFileSync } from "fs";
import { join } from "path";
import { format } from "util";

export function log(...things: any[]) {
	appendFileSync(
		join(process.cwd(), "./logs.txt"),
		things.map(thing =>
			typeof thing === "object"
				? format("%j", thing)
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