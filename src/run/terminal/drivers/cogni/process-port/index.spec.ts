import { spawn, ChildProcess } from "child_process";
import { toCogniProcess } from ".";
import { nexter, toBehaviorSubject, toTag } from "../../../../../utils";
import { take, mapTo } from "rxjs/operators";

const testProcess = (process: ChildProcess) => {
    let { stdout$, stdinWrite, exit$ } = toCogniProcess(process);
    let didExit$ = toBehaviorSubject(exit$.pipe(mapTo(true)), false);
    const stdout = nexter(stdout$);
    const willExit = exit$.pipe(take(1)).toPromise();

    const expectRunning = () => expect(didExit$.value).toBe(false)
    const expectWillExit = () => willExit;

    return {
        stdout,
        stdinWrite,
        expectRunning,
        expectWillExit
    };
}

const python = toTag(code => 
    testProcess(spawn("python", ["-c", code])
));


describe("port", () => {
    
    it.concurrent("works for process-empty", async () => {
        let { expectRunning, expectWillExit } = python``;

        expectRunning();
        await expectWillExit();
    })

    it.concurrent("works for process-out", async () => {
        try {
            let { stdout, expectRunning, expectWillExit } = python`print("stdout-1", end="")`;

            expectRunning();
            expect(await stdout()).toBe("stdout-1");

            await expectWillExit();
        } catch {
            
        }
    })

    it.concurrent("works for process-in", async () => {
        let { stdinWrite, expectRunning, expectWillExit } = python`input("")`

        expectRunning();
        stdinWrite("foo\n");

        expectRunning();
        await expectWillExit();
    })

    it.concurrent("works for process-in-out", async () => {
        let { stdout, stdinWrite, expectRunning, expectWillExit } = python`x = int(input("")); print(x + 1, end="")`;

        expectRunning();
        stdinWrite("1\n");

        expectRunning();
        expect(await stdout()).toBe("2");

        await expectWillExit();
    })

    it.concurrent("works for process-out-in", async () => {
        let { stdout, stdinWrite, expectRunning, expectWillExit } = python`print("stdout-1", end=""); input("")`;

        expectRunning();
        expect(await stdout()).toBe("stdout-1");

        expectRunning();
        stdinWrite("stdin-1\n");

        await expectWillExit();
    })

    it.concurrent("works for process-in-in", async () => {
        let { stdinWrite, expectRunning, expectWillExit } = python`input(""); input("")`;

        expectRunning();
        stdinWrite("stdin-1\n");

        expectRunning();
        stdinWrite("stdin-2\n");

        await expectWillExit();
    })

    it.concurrent("works for process-out-out", async () => {
        let { stdout, expectRunning, expectWillExit } = python`print("stdout-1", end=""); print("stdout-2", end="");`;

        expectRunning();
        expect(await stdout()).toBe("stdout-1stdout-2");
        await expectWillExit();
    })

    /*it.concurrent("works for process-error", async () => {
        let { expectWillNonZeroExit } = python`raise Exception("foo")`;

        await expectWillNonZeroExit();
    })*/
})
