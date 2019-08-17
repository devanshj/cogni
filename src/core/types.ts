import { Observable } from "rxjs";

export namespace Cogni {
    export type Output = {
        stdoutText: string,
        stdinAreas: Array<{
            position: {
                x: number,
                y: number
            },
            length: number
        }>,
        didExit: boolean
    }
    
    export type Input = {
        process: {
            stdout$: Observable<string>,
            stdinWrite: (data: string) => void,
            exit$: Observable<number>
        },
        feeds: Array<string>
    }
    
    export type Config = {
        noStdoutFallbackTimeout: number
    }
}