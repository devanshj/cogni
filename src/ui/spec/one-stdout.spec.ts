import { ui } from "..";
import { KeypressData, TerminalState } from "staerm";
import { BehaviorSubject, NEVER } from "rxjs";
import { toCogniProcess } from "../../process-port";
import { toCogniOutput } from "../../core";
import { filter, share } from "rxjs/operators";
import { notUndefined } from "../../utils";
import { nexter } from "../../testing/utils";
import { python } from "./utils";

describe("cogni-ui/one-stdout.py", () => {
	test("works", async () => {
		const keypress$ = new BehaviorSubject<KeypressData | undefined>(undefined);
		const spawnProcess = async () => toCogniProcess(python(
			`print("hello", end="")`
		));
		const staerm$ = new BehaviorSubject<TerminalState | undefined>(undefined);
		const staerm = nexter(staerm$);
		
		ui({
			keypress$: keypress$.pipe(filter(notUndefined)),
			refresh$: NEVER,
			spawnProcess,
			toCogniOutput
		}).pipe(share()).subscribe(staerm$);

		await staerm() // undefined
		await staerm() // text: ""
		expect(await staerm()).toStrictEqual({
			text: "hello",
			input: null
		});
	})
})
