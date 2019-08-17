import parseArgv from ".";

describe("parseArgv", () => {
    test.each<[string[], { arguments: string[], options: { [K in string]: string } }]>([
        [
            ["abc", "pqr", "-d", "-q", "qqq", "abc", "-a"],
            { arguments: ["abc", "pqr", "abc"], options: { "-d": "", "-q": "qqq", "-a": "" } }
        ]
    ])("case %#", (input, output) => {
        expect(parseArgv(input)).toStrictEqual(output);
    })
})