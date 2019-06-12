import { cogniOutputFor } from ".";
import { toCogniProcess } from "../run/terminal/drivers/cogni/process-port";
import { spawn } from "child_process";
import { CogniInput, CogniOutput } from "./types";
import { toTag, Omit } from "../utils";

const python = toTag((code: string): [string, string[]] => ["python", ["-c", code]])

describe("cogniOutput", () => {

    it.each([
        {
            cogniInput: {
                spawnArgs: python``,
                feeds: []
            },
            cogniOutput: {
                stdoutText: "",
                stdinFeeds: [], 
                didExit: true
            }
        },
        {
            cogniInput: {
                spawnArgs: python`print("stdout-1", end="")`,
                feeds: []
            },
            cogniOutput: {
                stdoutText: "stdout-1",
                stdinFeeds: [],
                didExit: true
            }
        },
        {
            cogniInput: {
                spawnArgs: python`input("")`,
                feeds: ["stdin-1"]
            },
            cogniOutput: {
                stdoutText: "stdin-1\n",
                stdinFeeds: [{
                    pos: { y: 0, x: 0 },
                    text: "stdin-1"
                }],
                didExit: true
            }
        },
        {
            cogniInput: {
                spawnArgs: python`x = int(input("")); print(x + 1, end="")`,
                feeds: ["1"]
            },
            cogniOutput: {
                stdoutText: "1\n2",
                stdinFeeds: [{
                    pos: { y: 0, x: 0 },
                    text: "1"
                }],
                didExit: true
            }
        },
        {
            cogniInput: {
                spawnArgs: python`x = int(input("")); print(x + 1, end="")`,
                feeds: []
            },
            cogniOutput: {
                stdoutText: "",
                stdinFeeds: [{
                    pos: { y: 0, x: 0 },
                    text: ""
                }],
                didExit: false
            }
        },
        {
            cogniInput: {
                spawnArgs: python`print("stdout-1", end=""); input("")`,
                feeds: ["stdin-1"]
            },
            cogniOutput: {
                stdoutText: "stdout-1stdin-1\n",
                stdinFeeds: [{
                    pos: { y: 0, x: 8 },
                    text: "stdin-1"
                }],
                didExit: true
            }
        },
        {
            cogniInput: {
                spawnArgs: python`input(""); input("")`,
                feeds: ["stdin-1", "stdin-2"]
            },
            cogniOutput: {
                stdoutText: "stdin-1\nstdin-2\n",
                stdinFeeds: [{
                    pos: { y: 0, x: 0 },
                    text: "stdin-1"
                }, {
                    pos: { y: 1, x: 0 },
                    text: "stdin-2"
                }],
                didExit: true
            }
        },
        {
            cogniInput: {
                spawnArgs: python`print("stdout-1", end=""); print("stdout-2", end="");`,
                feeds: []
            },
            cogniOutput: {
                stdoutText: "stdout-1stdout-2",
                stdinFeeds: [],
                didExit: true
            }
        },
        {
            cogniInput: {
                spawnArgs: python`a = int(input("a = ")); b = int(input("b = ")); print("a + b = " + str(a + b), end="")`,
                feeds: ["1", "2"]
            },
            cogniOutput: {
                stdoutText: "a = 1\nb = 2\na + b = 3",
                stdinFeeds: [{
                    pos: { y: 0, x: 4 },
                    text: "1"
                }, {
                    pos: { y: 1, x: 4 },
                    text: "2"
                }],
                didExit: true
            }
        },
        {
            cogniInput: {
                spawnArgs: python`a = int(input("a = ")); b = int(input("b = ")); print("a + b = " + str(a + b), end="")`,
                feeds: ["1"]
            },
            cogniOutput: {
                stdoutText: "a = 1\nb = ",
                stdinFeeds: [{
                    pos: { y: 0, x: 4 },
                    text: "1"
                }, {
                    pos: { y: 1, x: 4 },
                    text: ""
                }],
                didExit: false
            }
        }
    ])("works for case %#", async ({
        cogniInput: { spawnArgs, feeds },
        cogniOutput: expectedCogniOutput
    }: {
        cogniInput: Omit<CogniInput, "process"> & { spawnArgs: [string, string[]] },
        cogniOutput: CogniOutput
    }) => {
        
        let process = spawn(...spawnArgs);
        process.stderr.on("data", data => console.log(data.toString()));

        const actualCogniOutput = await cogniOutputFor({
            process: toCogniProcess(process),
            feeds
        });
        expect(actualCogniOutput).toStrictEqual(expectedCogniOutput);
        !process.killed && process.kill();
    })

})

