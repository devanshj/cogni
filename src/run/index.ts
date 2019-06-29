import { spawn } from "child_process";
import { emitKeypressEvents } from "readline";
import { combineLatest, EMPTY, Observable, of, Subject } from "rxjs";
import { map, mergeMap, share, switchMap } from "rxjs/operators";
import { KeypressData, terminal, withNodeProcess } from "staerm";
import { CogniInput, cogniOutputFor as toCogniOutput } from "../core";
import { toCogniProcess } from "../process-port";
import { clear, logWithTag } from "../testing/logger";
import { bindMethod } from "../utils";
import { toFocusedAreaIndex } from "./state/focused-area-index";
import { toStaermInput, StaermInput } from "./state/staerm-input";
import { toStaermText } from "./state/staerm-text";
import { watch } from "../testing/debug-observable";

const spawnProcess = () => toCogniProcess(spawn("python", ["./hello.py"]));

const main = (keypress$: Observable<KeypressData>) => {
    
    watch(keypress$, "keypress$");

    const cogniInput$ = new Subject<CogniInput>();
    watch(cogniInput$, "cogniInput$");
    cogniInput$.subscribe(({ feeds }) => logWithTag("cogniInput$")({ feeds, process: "[Process]" }));

    const cogniOutput$ = cogniInput$.pipe(mergeMap(toCogniOutput), share());
    watch(cogniOutput$, "cogniOutput$");

    const stdinAreas$ = cogniOutput$.pipe(map(o => o.stdinAreas));
    watch(stdinAreas$, "stdinAreas$");

    const stdinAreasLength$ = stdinAreas$.pipe(map(a => a.length));
    watch(stdinAreas$, "stdinAreasLength$");

    const stdoutText$ = cogniOutput$.pipe(map(o => o.stdoutText));
    watch(stdoutText$, "stdoutText$");

    const focusedAreaIndex$ = toFocusedAreaIndex(
        keypress$.pipe(
            switchMap(({ sequence }) =>
                sequence === "\u001b[A" ? of("UP" as const) :
                sequence === "\u001b[B" ? of("DOWN" as const) :
                sequence === "\r" ? of("DOWN" as const) :
                EMPTY
            )
        ),
        stdinAreasLength$
    );
    watch(focusedAreaIndex$, "focusedAreaIndex$");

    const staermInput$ = toStaermInput(
        focusedAreaIndex$,
        stdinAreas$,
        keypress$
    );
    watch(staermInput$, "staermInput$");
    
    const staermText$ = toStaermText(
        stdoutText$,
        staermInput$,
        keypress$
    );
    watch(staermText$, "staermText$");

    
    

    

/*
    const stdinAreas$ = merge(
        input$.pipe(
            filter(notNull),
            withLatestFrom(
                cogniOutput$.pipe(map(o => o.stdinAreas)),
                focusedAreaIndex$.pipe(filter(notNull))
            ),
            map(([{ position, length }, feeds, i]) =>
                splice(
                    feeds,
                    i,
                    1,
                    { position, length }
                )
            )
        )
    )
        

    const stdinFeeds$ = stdinAreas$.pipe(
        withLatestFrom(text$),
        map(([areas, text]) =>
            areas.map(
                ({ position: { x, y }, length }) => 
                    t.slice(text, { x, y }, { x: x + length, y })
            )
        ),
        startWith([] as string[])
    );

    stdinFeeds$.subscribe(f => {
        log("feeds = ")
        log(f);
    });

    stdinFeeds$.pipe(
        distinctUntilChanged(
            (ax, bx) => {
                log("ax = ");
                log(ax);
                log("bx = ");
                log(bx);
                
                return ax.length === bx.length &&
                ax.every((a, i) => a === bx[i])
            }
        ),
        tap(() => log("passes")),
        map(feeds => ({
            process: spawnProcess(),
            feeds
        }))
    ).subscribe(cogniInput$)

    // cogniInput$.pipe(map(i => i.feeds)).subscribe(log);
    */

    setTimeout(() => {
        cogniInput$.next({
            process: spawnProcess(),
            feeds: []
        })
    })
    


    const staerm$ = (() => 
        combineLatest(
            staermText$,
            staermInput$
        ).pipe(
            map(([text, input]) => ({ text, input }))
        ))();
    watch(staerm$, "staerm$");

    return staerm$;
}


process.stdin.setRawMode!(true);
emitKeypressEvents(process.stdin);
const { io, state } = withNodeProcess(terminal(), process)
main(
    new Observable<KeypressData>(keypress$ => {
        io.keypress.listen(
            bindMethod(keypress$, "next")
        )
    }).pipe(share())
).subscribe(state.set);

process.on("exit", clear);
