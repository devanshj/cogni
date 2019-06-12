import { Sinks, Sources } from "../../../main/types";
import { Subject, of, EMPTY, concat, NEVER, merge } from "rxjs";
import { Terminal, InputField } from "./internal";
import { map, switchMap, distinctUntilChanged, withLatestFrom, filter, mapTo, startWith } from "rxjs/operators";

export const makeUiDriver = async () => 
    (terminal => 
        (sink$: Sinks["ui"]): Sources["ui"] => {

            const actualInputField$ = new Subject<InputField>();
            const inputKey$ = actualInputField$.pipe(
                switchMap(field => field.key$)
            );

            const event$ =  merge(
                inputKey$.pipe(
                    switchMap(key =>
                        key === "ENTER" ? of("INPUT_KEYDOWN_ENTER" as const) :
                        key === "DOWN" ? of("INPUT_KEYDOWN_DOWN" as const) :
                        key === "UP" ? of("INPUT_KEYDOWN_UP" as const) :
                        EMPTY
                    ),
                    ($ => concat($, NEVER))
                ),
                inputKey$.pipe(
                    switchMap(() => actualInputField$),
                    map(field => field.getValue()),
                    distinctUntilChanged(),
                    mapTo("INPUT_CHANGE" as const)
                )
            );

            sink$.pipe(
                map(sink => sink.inputField),
                distinctUntilChanged(),
                map(({ pos, value }) => terminal.takeInput({ pos, defaultValue: value }))
            ).subscribe(actualInputField$);

            const inputField$ = event$.pipe(
                filter(event => event === "INPUT_CHANGE"),
                withLatestFrom(actualInputField$),
                map(([_, field]) => ({
                    value: field.getValue(),
                    caretPos: field.getCaretPos(),
                    pos: field.pos
                }))
            );

            sink$.pipe(
                map(sink => sink.stdout),
                distinctUntilChanged(),
                withLatestFrom(actualInputField$.pipe(startWith(null)))
            ).subscribe(([{ text, feeds }, inputField]) => {
		
                terminal.clear();
                terminal.moveTo({ x: 0, y: 0 });
                terminal.echo(text);
            
                feeds.forEach(({ pos, text }) => {
                    terminal.moveTo(pos);
                    terminal.echo(text);
                });

                inputField && inputField.redraw();
            })

            return {
                event$,
                inputField$
            };
        }
    )(await Terminal.withConfig({ determineOriginPos: true }))
    