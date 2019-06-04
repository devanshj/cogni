import { terminal, defaultInputKeyBindings } from "../internals/terminal-kit";
import { Observable, Subscription, fromEvent } from "rxjs";
import { map, delay } from "rxjs/operators";
import size from "window-size";

export class Terminal {
    originPos = { x: 0, y: 0 }

    static async withConfig({ determineOriginPos = false }: TerminalConfig): Promise<Terminal> {
        let term = new Terminal();
        if (determineOriginPos) {
            term.originPos = await getCursorLocation();
        }
        
        terminal.on("key", (key: string) => key === "CTRL_C" && process.exit());
        return term;
    }

    moveTo({ x, y }: { x: number, y: number }) {
        terminal.moveTo(this.originPos.x + x, this.originPos.y + y);
    }

    clear() {
        terminal.eraseArea(
            this.originPos.x, this.originPos.y,
            size.width, size.height
        );
    }

    echo(data: string) {
        terminal(data);
    }
    
    
    takeInput({ pos, defaultValue = "" }: { pos: { x: number, y: number } , defaultValue: string }) {
        this.moveTo(pos);
        let _inputField = terminal.inputField({
            default: defaultValue,
            keyBindings: {
                ...defaultInputKeyBindings,
                ENTER: "",
                KP_ENTER: ""
            }
        });
        let keySubscription: Subscription;

        return {
            getValue: () => _inputField.getInput(),
            setValue: (value: string) => {
                return this.takeInput({ pos, defaultValue: value });
            },
            abort: () => _inputField.abort(),
            redraw: () => _inputField.redraw(),
            key$: new Observable<"ENTER"|"UP"|"DOWN">(observer => {

                keySubscription = fromEvent<[string]>(terminal, "key").pipe(
                    map(([key]) => <"ENTER"|"UP"|"DOWN">key),
                    delay(0)
                ).subscribe(observer);

                return () => {
                    keySubscription.unsubscribe();
                    _inputField.abort();
                }
            }),
            getCaretPos: () => _inputField.getCursorPosition()
        }
    }

    static preserveCursor<A extends unknown[]>(fn: (...a: A) => void): (...a: A) => void {
        return (...args: A) => {
            terminal.saveCursor();
            fn(...args);
            terminal.restoreCursor();
        }
    }
}

function getCursorLocation(): Promise<{ x: number, y: number }> {
    return new Promise(resolve => {
        terminal.getCursorLocation((_, x, y) => {
            resolve({ x: x!, y: y! })
        })
    })
}




export interface TerminalConfig {
    originPos?: { x: number, y: number },
    determineOriginPos?: boolean
}