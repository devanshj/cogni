import { ChildProcess } from "child_process";
import main from "../main";
import { makeCogniDriver } from "./drivers/cogni";
import { makeUiDriver } from "./drivers/ui";
import { Subject, ObservedValueOf } from "rxjs";
import { Sinks } from "../main/types";

const app = async ({ processSpawner }: { processSpawner: () => ChildProcess }) => {
    const cogniSource = makeCogniDriver({ processSpawner })();
    const uiSink$ = new Subject<ObservedValueOf<Sinks["ui"]>>();
    const uiSource = (await makeUiDriver())(uiSink$);
    const externalSource = {
        refresh$: new Subject<never>()
    }
    
    const sinks = main({
        ui: uiSource,
        cogni: cogniSource,
        external: externalSource
    });
    sinks.ui.subscribe(uiSink$);

    return {
        refresh: () => externalSource.refresh$.next()
    }
}
export default app;