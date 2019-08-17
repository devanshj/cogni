import { spawn } from "child_process";
import { KeypressData } from "staerm";

export const python = (...lines: string[]) =>
	spawn("python", ["-c", lines.join("\n")])

const keyMap = {
	"UP": "\u001b[A",
	"DOWN": "\u001b[B",
	"LEFT": "\u001b[D",
	"RIGHT": "\u001b[C",
	"BACKSPACE": "\b",
	"DELETE": "\u001b[3~",
	"HOME": "\u001b[1~",
	"END": "\u001b[4~"
} as Record<string, string>;

export const key = (sequence: string): KeypressData => ({
	sequence: keyMap[sequence] || sequence,
	ctrl: false,
	shift: false,
	meta: false
})