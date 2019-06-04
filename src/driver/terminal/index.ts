import { BehaviorSubject, from, Subject, zip, merge } from "rxjs";
import { distinctUntilChanged, map, mergeMap, filter, switchMap, mapTo, distinctUntilKeyChanged, debounceTime, tap, zip as zipWith, withLatestFrom, share, startWith, delay, take } from "rxjs/operators";
import { spawn, ChildProcess } from "child_process";
import { takeWithoutComplete, notNull, splice, unzip, toBehaviorSubject, toSubject, notNullDeep } from "../../utils";

import { toCogniProcess } from "./process-port";
import { Terminal } from "./ui/terminal";
import { AppConfig } from "./types";
import { cogniOutputFor, CogniOutput, CogniInput  } from "../../core";

import { log, clear } from "../../logger";
import { start } from "repl";

export default async function app({ processSpawner }: AppConfig) {
	let lastSpawnedProcess: ChildProcess | null = null;
	const spawnCogniProcess = (): CogniInput["childProcess"] => {
		if (lastSpawnedProcess) {
			lastSpawnedProcess.removeAllListeners();
			lastSpawnedProcess.kill()  
		}

		lastSpawnedProcess = processSpawner();
		return toCogniProcess(lastSpawnedProcess);
	};
	const terminal = await Terminal.withConfig({ determineOriginPos: true });
	type InputField = ReturnType<Terminal["takeInput"]>;

	



	/* =============================================== */
	/* State */

	const cogniInput$ = new BehaviorSubject<CogniInput | null>(null);	
	const inputFieldValue$ = new BehaviorSubject<string | null>(null);
	const inputKey$ = new Subject<string>();










	/* ================================================ */
	/* cogniInput$ */

	/* cogniInput$ -> cogniOutput$  */
	const cogniOutput$ = cogniInput$.pipe(
		filter(notNull),
		distinctUntilChanged(),
		mergeMap(cogniInput => from(cogniOutputFor(cogniInput))),
		share()
	);












	/* ================================================ */
	/* cogniOutput$ */

	/* cogniOutput$ -> focusedFeedIndex$ */
	const focusedFeedIndex$ = toSubject(cogniOutput$.pipe(
		filter(notNull),
		take(1),
		mapTo(0),
		delay(0)
	));













	/* ================================================ */
	/* focusedFeedIndex$ */

	/* focusedFeedIndex$ -> inputField$  */
	const inputField$ = toSubject(
		focusedFeedIndex$.pipe(
			distinctUntilChanged(),
			withLatestFrom(cogniOutput$),
			filter(notNullDeep),
			map(([index, cogniOutput]) => {
				let { pos, text: defaultValue } = cogniOutput.stdinFeeds[index];
				return terminal.takeInput({ pos, defaultValue });
			})
		)
	);













	
	/* ================================================ */
	/* inputField$ */

	/* inputField$ -> inputKey$ */
	inputField$.pipe(
		filter(notNull),
		switchMap(inputField => inputField.key$)
	).subscribe(inputKey$);










	/* ================================================ */
	/* inputKey$ */

	/* inputKey$ -> ENTER && inputField$, cogniInput$  */

	/* inputKey$.pipe(
		filter(key => key === "ENTER"),
		withLatestFrom(inputField$, cogniOutput$, focusedFeedIndex$.pipe(filter(notNull))),
		map(([_, inputField, cogniOutput, focusedFeedIndex]) => 
			((inputFieldValue, carerPos, m) =>
				([
					{
						childProcess: spawnCogniProcess(),
						stdinFeedTexts: splice(
							cogniOutput.stdinFeeds.map(x => x.text),
							focusedFeedIndex,
							1,
							inputFieldValue.substring(0, carerPos),
							inputFieldValue.substring(carerPos)
						).slice(0, m)
					},
					((focusedFeedIndex + 1) + m) % m
				] as [CogniInput, number])
			)(inputField!.getValue(), inputField!.getCaretPos(), cogniOutput.stdinFeeds.length)
		)
	).subscribe(unzip(cogniInput$, focusedFeedIndex$));
	*/

	/* inputKey$ -> "DOWN" || "UP"|| "ENTER" && focusedFeedIndex$  */
	inputKey$.pipe(
		filter(key => key === "DOWN" || key === "UP" || key === "ENTER"),
		withLatestFrom(cogniOutput$, focusedFeedIndex$.pipe(filter(notNull))),
		map(([dir, cogniOutput, focusedFeedIndex]) => 
			(m => ((focusedFeedIndex + (dir === "UP" ? -1 : +1)) + m) % m
			)(cogniOutput.stdinFeeds.length)
		)
	).subscribe(focusedFeedIndex$);


	/* inputKey$ -> !("DOWN" || "UP" || "ENTER") && inputFieldValue$  */
	inputKey$.pipe(
		filter(key => !(key === "UP" || key === "DOWN" || key === "ENTER")),
		withLatestFrom(inputField$),
		map(([_, inputField]) => inputField),
		filter(notNull),
		map(inputField => inputField.getValue()),
		distinctUntilChanged(),
		debounceTime(100)
	).subscribe(inputFieldValue$);








	
	/* ================================================ */
	/* inputFieldValue$ */

	/* inputFieldValue$ -> cogniInput$  */
	inputFieldValue$.pipe(
		withLatestFrom(cogniOutput$, focusedFeedIndex$.pipe(filter(notNull))),
		map(([inputFieldValue, cogniOutput, focusedFeedIndex]) =>
			({
				childProcess: spawnCogniProcess(),
				stdinFeedTexts: 
					inputFieldValue === ""
						? cogniOutput.stdinFeeds
							.map(x => x.text)
							.slice(0, focusedFeedIndex)
							
						: splice(
							cogniOutput.stdinFeeds.map(x => x.text),
							focusedFeedIndex,
							1,
							inputFieldValue
						).slice(0, cogniOutput.stdinFeeds.length)
			}) as CogniInput
		)
	).subscribe(cogniInput$);








	
	/* ================================================ */
	/* Effects */

	cogniOutput$.pipe(
		distinctUntilKeyChanged("stdoutText"),
		withLatestFrom(focusedFeedIndex$.pipe(startWith(0)), inputField$.pipe(startWith(null)))
	).subscribe(([cogniOutput, focusedFeedIndex, inputField]) => {
		let { stdinFeeds, stdoutText } = cogniOutput;
		
		terminal.clear();
		terminal.moveTo({ x: 0, y: 0 });
		terminal.echo(stdoutText);
	
		stdinFeeds
		.filter((_,i) => i !== focusedFeedIndex)
		.forEach(({ pos, text }) => {
			terminal.moveTo(pos);
			terminal.echo(text);
		});

		inputField && inputField.redraw()
	});

	/* ================================================ */
	/* Init */

	cogniInput$.next({
		childProcess: spawnCogniProcess(),
		stdinFeedTexts: []
	})
	
	let refresh$ = new Subject();

	refresh$.pipe(
		withLatestFrom(cogniOutput$),
		map(([_, cogniOutput]) => ({
			childProcess: spawnCogniProcess(),
			stdinFeedTexts: cogniOutput.stdinFeeds.map(x => x.text)
		})),
		tap(x => log(x))
	).subscribe(cogniInput$);


	cogniInput$.subscribe(x => log(x));

	setTimeout(() => {
		log(cogniInput$.value);
	}, 5000)

	return { 
		refresh: () => refresh$.next()
	};
}

// process.on("exit", () => clear());