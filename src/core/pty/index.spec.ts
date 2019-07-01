import { pty, TerminalState } from ".";

describe("cogni/pty", () => {
    it("works", () => {
        let term: TerminalState = {
            text: "",
            curPos: { x: 0, y: 0 },
            stdinAreas: []
        }

        expect(term.text).toBe("");
        expect(term.curPos).toStrictEqual({ x: 0, y: 0 });
        expect(term.stdinAreas).toStrictEqual([]);

        term = pty.stdoutWrite(term, "a = ");
        expect(term.text).toBe("a = ");
        expect(term.curPos).toStrictEqual({ x: 4, y: 0 });
        expect(term.stdinAreas).toStrictEqual([]);

        term = pty.stdinWrite(term, "1");
        expect(term.text).toBe("a = 1");
        expect(term.curPos).toStrictEqual({ x: 5, y: 0 });
        expect(term.stdinAreas).toStrictEqual([{ 
            position: { x: 4, y: 0 },
            length: 1
        }]);

        term = pty.stdoutWrite(term, "\n");
        expect(term.text).toBe("a = 1\n");
        expect(term.curPos).toStrictEqual({ x: 0, y: 1 });
        expect(term.stdinAreas).toStrictEqual([{ 
            position: { x: 4, y: 0 },
            length: 1
        }]);

        term = pty.stdoutWrite(term, "aa = ");
        term = pty.stdinWrite(term, "20");
        term = pty.stdoutWrite(term, "\n");
        term = pty.stdoutWrite(term, "a + aa = 21");

        expect(term.text).toBe("a = 1\naa = 20\na + aa = 21");
        expect(term.curPos).toStrictEqual({ x: "a + aa = 21".length, y: 2 });
        expect(term.stdinAreas).toStrictEqual([
            { 
                position: { x: 4, y: 0 },
                length: 1
            },
            { 
                position: { x: 5, y: 1 },
                length: 2
            }
        ]);
    })
})