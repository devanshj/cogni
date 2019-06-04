import { Subject, merge, of } from "rxjs";
import { scan, map, takeUntil, delay, catchError, mapTo } from "rxjs/operators";
import { toBehaviorSubject } from "../utils";

import { CogniInput, CogniOutput } from "./types";
import fallback from "./operators/fallback";

export const NO_STDOUT_FALLBACK_TIMEOUT = 200;

type TerminalState = {
    stdout: {
        text: string,
        curPos: {x: number, y: number }
    },
    stdinFeeds: CogniOutput["stdinFeeds"]
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


export const cogniOutputFor = ({ childProcess, stdinFeedTexts }: CogniInput): Promise<CogniOutput> => {
    let { exit$, stdout$, stdinWrite } = childProcess;
    let didExit$ = toBehaviorSubject(exit$.pipe(mapTo(true)), false);
    let noStdinFeeds$ = new Subject<true>();

    return stdout$.pipe(
        fallback(null, NO_STDOUT_FALLBACK_TIMEOUT),
        map(x => x === null ? "" : x),
        scan(
            ({ stdout, stdinFeeds }: TerminalState, data: string) => {

                stdout = stdoutReducer(stdout, data);

                let nextFeed = stdinFeedTexts.shift();
                if (nextFeed) {
                    if (!didExit$.value) {
                        stdinFeeds = [...stdinFeeds, {
                            pos: stdout.curPos,
                            text: nextFeed
                        }];

                        try {
                            stdinWrite(nextFeed + "\n");
                            stdout = stdoutReducer(stdout, nextFeed + "\n");
                        } catch {

                        }
                    }
                } else {
                    noStdinFeeds$.next(true);
                }

                return { stdout, stdinFeeds }
            }, {
                stdout: {
                    text: "",
                    curPos: { x: 0, y: 0 }
                },
                stdinFeeds: []
            }
        ),
        map(({ stdout, stdinFeeds }) => ({
            stdoutText: stdout.text,
            stdinFeeds
        })),
        takeUntil(merge(
            exit$,
            noStdinFeeds$.pipe(delay(NO_STDOUT_FALLBACK_TIMEOUT))
        ))
    )
    .toPromise()
    .then(({ stdoutText, stdinFeeds }) => {
        didExit$.complete();

        if (!didExit$.value) {
            stdinFeeds.push({
                pos: curPosReducer({ x: 0, y: 0 }, stdoutText),
                text: ""
            });
        }

        return Promise.resolve({
            stdoutText,
            stdinFeeds,
            didExit: didExit$.value
        });
    });
}

export * from "./types";