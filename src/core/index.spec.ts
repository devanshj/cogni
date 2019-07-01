import { toCogniOutput } from ".";
import { toCogniProcess } from "../process-port";
import { spawn } from "child_process";
import { CogniInput, CogniOutput } from "./types";
import { toTag } from "../utils";

const python = toTag((code: string): [string, string[]] => ["python", ["-c", code]])

describe("cogni/core", () => {

    it.each([
        {
            cogniInput: {
                spawnArgs: python``,
                feeds: []
            },
            cogniOutput: {
                stdoutText: "",
                stdinAreas: [], 
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
                stdinAreas: [],
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
                stdinAreas: [{
                    position: { y: 0, x: 0 },
                    length: "stdin-1".length
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
                stdinAreas: [{
                    position: { y: 0, x: 0 },
                    length: "1".length
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
                stdinAreas: [{
                    position: { y: 0, x: 0 },
                    length: "".length
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
                stdinAreas: [{
                    position: { y: 0, x: 8 },
                    length: "stdin-1".length
                }],
                didExit: true
            }
        },
        {
            cogniInput: {
                spawnArgs: python`input(""); input("")`,
                feeds: ["mango", "banana"]
            },
            cogniOutput: {
                stdoutText: "mango\nbanana\n",
                stdinAreas: [{
                    position: { y: 0, x: 0 },
                    length: "mango".length
                }, {
                    position: { y: 1, x: 0 },
                    length: "banana".length
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
                stdinAreas: [],
                didExit: true
            }
        },
        {
            cogniInput: {
                spawnArgs: python`a = int(input("a = ")); b = int(input("b = ")); print("a + b = " + str(a + b), end="")`,
                feeds: ["1", "20"]
            },
            cogniOutput: {
                stdoutText: "a = 1\nb = 20\na + b = 21",
                stdinAreas: [{
                    position: { y: 0, x: 4 },
                    length: "1".length
                }, {
                    position: { y: 1, x: 4 },
                    length: "20".length
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
                stdinAreas: [{
                    position: { y: 0, x: 4 },
                    length: "1".length
                }, {
                    position: { y: 1, x: 4 },
                    length: "".length
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

        const actualCogniOutput = await toCogniOutput({
            process: toCogniProcess(process),
            feeds
        });
        expect(actualCogniOutput).toStrictEqual(expectedCogniOutput);
        process.removeAllListeners();
        !process.killed && process.kill();
    })

    it("does not mutate the feeds", async () => {
        let originalFeeds = ["hello"];
        let feeds = [...originalFeeds];
        await toCogniOutput({
            process: toCogniProcess(spawn(...python`print(input("name? "))`)),
            feeds: feeds
        });
        expect(feeds).toStrictEqual(originalFeeds);
    })
})

