import { Subject, from, merge } from "rxjs"
import { withLatestFrom, map, startWith, mergeMap, share } from "rxjs/operators";
import { State, Event, Sources, Sinks } from "./types";
import { cogniInputReducer, focusedFeedIndexReducer } from "./reducers";
import { spreadMap, combineLatest } from "../../utils";

const main = (sources: Sources): Sinks => {

    const state$ = new Subject<State>();
    const eventWithState$ = sources.ui.event$.pipe(
        withLatestFrom(state$),
        map(([event, state]) => [state, event] as [State, Event])
    );

    const _cogniInput$ = eventWithState$.pipe(
        spreadMap(cogniInputReducer),
        startWith({
            process: sources.cogni.spawn(),
            feeds: []
        } as State["cogniInput"])
    );

    const cogniInput$ = merge(
        _cogniInput$,
        sources.external.refresh$.pipe(
            withLatestFrom(_cogniInput$),
            map(([_, i]) => ({ ... i}))
        )
    )

    const focusedFeedIndex$ = eventWithState$.pipe(
        spreadMap(focusedFeedIndexReducer),
        startWith(0)
    );

    const cogniOutput$ = cogniInput$.pipe(
        mergeMap(input => from(sources.cogni.outputFor(input))),
        share()
    );

    const stdout$ = cogniOutput$.pipe(
        withLatestFrom(focusedFeedIndex$),
        map(([cogniOutput, focusedFeedIndex]) => ({
            text: cogniOutput.stdoutText,
            feeds: cogniOutput.stdinFeeds.filter((_, i) => i !== focusedFeedIndex)
        }))
    )

    const inputField$ = sources.ui.inputField$;

    combineLatest({
        cogniInput: cogniInput$,
        focusedFeedIndex: focusedFeedIndex$,
        cogniOutput: cogniOutput$,
        inputField: inputField$
    }).subscribe(state$);

    return {
        ui: combineLatest({ 
            inputField: inputField$,
            stdout: stdout$
        })
    };
}

export default main;