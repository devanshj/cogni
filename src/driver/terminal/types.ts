import { ChildProcess } from "child_process";

export type AppConfig = { 
    processSpawner: () => ChildProcess
}