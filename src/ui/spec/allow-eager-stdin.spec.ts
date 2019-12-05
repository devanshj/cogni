import { ui } from "..";
import { KeypressData, TerminalState } from "staerm";
import { BehaviorSubject, NEVER } from "rxjs";
import { toCogniProcess } from "../../process-port";
import { toCogniOutput } from "../../core";
import { filter, share } from "rxjs/operators";
import { notUndefined } from "../../utils";
import { nexter } from "../../testing/utils";
import { python, key } from "./utils";

describe.skip("allow-eager-stdin", () => {

	test("eager stdin area does not exists before last stdin is filled", async () => {
		const keypress$ = new BehaviorSubject<KeypressData | undefined>(undefined);
		const spawnProcess = async () => toCogniProcess(python(
			`input();input();`
		));
		const staerm$ = new BehaviorSubject<TerminalState | undefined>(undefined);
		const staerm = nexter(staerm$);
		
		ui({
			keypress$: keypress$.pipe(filter(notUndefined)),
			refresh$: NEVER,
			spawnProcess,
			toCogniOutput,
			allowEagerStdin: true
		}).pipe(share()).subscribe(staerm$);

		await staerm() // undefined
		await staerm() // text: ""
		expect(await staerm()).toStrictEqual({
			text: "",
			input: {
				position: { x: 0, y: 0 },
				caretOffset: 0,
				length: 0
			}
		});

		keypress$.next(key("DOWN"));
		expect(await staerm()).toStrictEqual({
			text: "",
			input: {
				position: { x: 0, y: 0 },
				caretOffset: 0,
				length: 0
			}
		});
	})


	test("eager stdin area exists after last stdin is filled", async () => {
		const keypress$ = new BehaviorSubject<KeypressData | undefined>(undefined);
		const spawnProcess = async () => toCogniProcess(python(
			`input();input();`
		));
		const staerm$ = new BehaviorSubject<TerminalState | undefined>(undefined);
		const staerm = nexter(staerm$);
		
		ui({
			keypress$: keypress$.pipe(filter(notUndefined)),
			refresh$: NEVER,
			spawnProcess,
			toCogniOutput,
			allowEagerStdin: true
		}).pipe(share()).subscribe(staerm$);

		await staerm() // undefined
		await staerm() // text: ""
		expect(await staerm()).toStrictEqual({
			text: "",
			input: {
				position: { x: 0, y: 0 },
				caretOffset: 0,
				length: 0
			}
		});

		keypress$.next(key("1"));
		keypress$.next(key("DOWN"));
		expect(await staerm()).toStrictEqual({
			text: "1",
			input: {
				position: { x: 0, y: 1 },
				caretOffset: 0,
				length: 0
			}
		});
	})

	test("eager stdin area is removed when last stdin area is empty", async () => {
		const keypress$ = new BehaviorSubject<KeypressData | undefined>(undefined);
		const spawnProcess = async () => toCogniProcess(python(
			`input();input();`
		));
		const staerm$ = new BehaviorSubject<TerminalState | undefined>(undefined);
		const staerm = nexter(staerm$);
		
		ui({
			keypress$: keypress$.pipe(filter(notUndefined)),
			refresh$: NEVER,
			spawnProcess,
			toCogniOutput,
			allowEagerStdin: true
		}).pipe(share()).subscribe(staerm$);

		await staerm() // undefined
		await staerm() // text: ""
		expect(await staerm()).toStrictEqual({
			text: "",
			input: {
				position: { x: 0, y: 0 },
				caretOffset: 0,
				length: 0
			}
		});

		keypress$.next(key("1"));
		keypress$.next(key("DOWN"));
		expect(await staerm()).toStrictEqual({
			text: "1",
			input: {
				position: { x: 0, y: 1 },
				caretOffset: 0,
				length: 0
			}
		});

		keypress$.next(key("UP"));
		keypress$.next(key("BACKSPACE"));
		expect(await staerm()).toStrictEqual({
			text: "",
			input: {
				position: { x: 0, y: 0 },
				caretOffset: 0,
				length: 0
			}
		});

		keypress$.next(key("DOWN"));
		expect(await staerm()).toStrictEqual({
			text: "",
			input: {
				position: { x: 0, y: 0 },
				caretOffset: 0,
				length: 0
			}
		});
	})

	test("eager stdin area is removed when after process exits", async () => {
		const keypress$ = new BehaviorSubject<KeypressData | undefined>(undefined);
		const spawnProcess = async () => toCogniProcess(python(
			`input();input();`
		));
		const staerm$ = new BehaviorSubject<TerminalState | undefined>(undefined);
		const staerm = nexter(staerm$);
		
		ui({
			keypress$: keypress$.pipe(filter(notUndefined)),
			refresh$: NEVER,
			spawnProcess,
			toCogniOutput,
			allowEagerStdin: true
		}).pipe(share()).subscribe(staerm$);

		await staerm() // undefined
		await staerm() // text: ""
		expect(await staerm()).toStrictEqual({
			text: "",
			input: {
				position: { x: 0, y: 0 },
				caretOffset: 0,
				length: 0
			}
		});

		keypress$.next(key("1"));
		expect(await staerm()).toStrictEqual({
			text: "1",
			input: {
				position: { x: 0, y: 0 },
				caretOffset: 1,
				length: 1
			}
		});

		keypress$.next(key("DOWN"));
		keypress$.next(key("2"));
		expect(await staerm()).toStrictEqual({
			text: "1\n2",
			input: {
				position: { x: 0, y: 1 },
				caretOffset: 1,
				length: 1
			}
		});

		keypress$.next(key("DOWN"));
		keypress$.next(key("3"));
		expect(await staerm()).toStrictEqual({
			text: "1\n2\n3",
			input: {
				position: { x: 0, y: 2 },
				caretOffset: 1,
				length: 1
			}
		});

		expect(await staerm()).toStrictEqual({
			text: "1\n2",
			input: {
				position: { x: 0, y: 1 },
				caretOffset: 1,
				length: 1
			}
		});
	})
})