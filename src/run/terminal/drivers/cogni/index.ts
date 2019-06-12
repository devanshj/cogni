import { Sinks, Sources } from "../../../main/types";
import { ChildProcess } from "child_process";
import { toCogniProcess } from "./process-port";
import { cogniOutputFor } from "../../../../core";

export const makeCogniDriver = ({ processSpawner: spawnProcess }: { processSpawner: () => ChildProcess }) =>
    (): Sources["cogni"] => ({
        spawn: () => toCogniProcess(spawnProcess()),
        outputFor: cogniOutputFor 
    });