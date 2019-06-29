import { Subject, merge, of } from "rxjs";
import { scan, map, takeUntil, delay, catchError, mapTo } from "rxjs/operators";
import { toBehaviorSubject } from "../utils";

import { CogniInput, CogniOutput } from "./types";
import fallback from "./operators/fallback";

export const NO_STDOUT_FALLBACK_TIMEOUT = 500;

type TerminalState = {
    stdout: {
        text: string,
        curPos: {x: number, y: number }
    },
    stdinAreas: CogniOutput["stdinAreas"]
};

const curPosReducer = ({ x, y }: TerminalState["stdout"]["curPos"], data: string) =>
    (lines =>
        ({
            y: lines.length === 1
                ? y
                : y + (lines.length - 1),
            x: lines.length === 1
                ? x + lines[0].length
                : lines.slice(-1)[0].length
        })
    )(data.split(/\n/g))


const stdoutReducer = ({ text, curPos: { x, y } }: TerminalState["stdout"], data: string) => ({
    text: text + data,
    curPos: curPosReducer({ x, y }, data)
});


export const cogniOutputFor = ({ process, feeds }: CogniInput): Promise<CogniOutput> => {
    let { exit$, stdout$, stdinWrite } = process;
    let didExit$ = toBehaviorSubject(exit$.pipe(mapTo(true)), false);
    let noStdinAreas$ = new Subject<true>();

    return stdout$.pipe(
        fallback(null, NO_STDOUT_FALLBACK_TIMEOUT),
        map(x => x === null ? "" : x),
        scan(
            ({ stdout, stdinAreas }: TerminalState, data: string) => {

                stdout = stdoutReducer(stdout, data);

                let nextFeed = feeds.shift();
                if (nextFeed) {
                    if (!didExit$.value) {
                        stdinAreas = [...stdinAreas, {
                            position: stdout.curPos,
                            length: nextFeed.length
                        }];

                        try {
                            stdinWrite(nextFeed + "\n");
                            stdout = stdoutReducer(stdout, nextFeed + "\n");
                        } catch {

                        }
                    }
                } else {
                    noStdinAreas$.next(true);
                }

                return { stdout, stdinAreas }
            }, {
                stdout: {
                    text: "",
                    curPos: { x: 0, y: 0 }
                },
                stdinAreas: []
            }
        ),
        map(({ stdout, stdinAreas }) => ({
            stdoutText: stdout.text,
            stdinAreas
        })),
        takeUntil(merge(
            exit$,
            noStdinAreas$.pipe(delay(NO_STDOUT_FALLBACK_TIMEOUT))
        ))
    )
    .toPromise()
    .then(({ stdoutText, stdinAreas }) => {
        didExit$.complete();

        if (!didExit$.value) {
            stdinAreas.push({
                position: curPosReducer({ x: 0, y: 0 }, stdoutText),
                length: 0
            });
        }

        return Promise.resolve({
            stdoutText,
            stdinAreas,
            didExit: didExit$.value
        });
    });
}

export * from "./types";