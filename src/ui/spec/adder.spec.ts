import { ui } from "../";
import { KeypressData, TerminalState } from "staerm";
import { BehaviorSubject, NEVER } from "rxjs";
import { toCogniProcess } from "../../process-port";
import { toCogniOutput } from "../../core";
import { filter, share } from "rxjs/operators";
import { notUndefined } from "../../utils";
import { nexter } from "../../testing/utils";
import { python, key } from "./utils";

describe("cogni-ui/adder.py", () => {
	test("works", async () => {
		const keypress$ = new BehaviorSubject<KeypressData | undefined>(undefined);
		const spawnProcess = async () => toCogniProcess(python(
			`a = int(input("a = "))`,
			`aa = int(input("aa = "))`,
			`print("a + aa = " + str(a + aa), end="")`
		));
		const staerm$ = new BehaviorSubject<TerminalState | undefined>(undefined);
		const staerm = nexter(staerm$);
		
		ui({
			keypress$: keypress$.pipe(filter(notUndefined)),
			refresh$: NEVER,
			spawnProcess,
			toCogniOutput
		}).pipe(share()).subscribe(staerm$);

		await staerm()
		await staerm()
		expect(await staerm()).toStrictEqual({
			text: "a = ",
			input: {
				position: {
					x: "a = ".length,
					y: 0
				},
				caretOffset: 0,
				length: 0
			}
		})

		keypress$.next(key("1"));
		expect(await staerm()).toStrictEqual({
			text: "a = 1",
			input: {
				position: {
					x: "a = ".length,
					y: 0
				},
				caretOffset: 1,
				length: 1
			}
		})
		expect(await staerm()).toStrictEqual({
			text: "a = 1\naa = ",
			input: {
				position: {
					x: "a = ".length,
					y: 0
				},
				caretOffset: 1,
				length: 1
			}
		})

		keypress$.next(key("DOWN"));
		expect(await staerm()).toStrictEqual({
			text: "a = 1\naa = ",
			input: {
				position: {
					x: "aa = ".length,
					y: 1
				},
				caretOffset: 0,
				length: 0
			}
		})

		keypress$.next(key("2"));
		expect(await staerm()).toStrictEqual({
			text: "a = 1\naa = 2",
			input: {
				position: {
					x: "aa = ".length,
					y: 1
				},
				caretOffset: 1,
				length: 1
			}
		})
		expect(await staerm()).toStrictEqual({
			text: "a = 1\naa = 2\na + aa = 3",
			input: {
				position: {
					x: "aa = ".length,
					y: 1
				},
				caretOffset: 1,
				length: 1
			}
		})

		keypress$.next(key("LEFT"));
		expect(await staerm()).toStrictEqual({
			text: "a = 1\naa = 2\na + aa = 3",
			input: {
				position: {
					x: "aa = ".length,
					y: 1
				},
				caretOffset: 0,
				length: 1
			}
		})

		keypress$.next(key("3"));
		expect(await staerm()).toStrictEqual({
			text: "a = 1\naa = 32\na + aa = 3",
			input: {
				position: {
					x: "aa = ".length,
					y: 1
				},
				caretOffset: 1,
				length: 2
			}
		})
		expect(await staerm()).toStrictEqual({
			text: "a = 1\naa = 32\na + aa = 33",
			input: {
				position: {
					x: "aa = ".length,
					y: 1
				},
				caretOffset: 1,
				length: 2
			}
		})
	})
})
