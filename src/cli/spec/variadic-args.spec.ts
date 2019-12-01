import { command, argument, t, program } from "../targs"

describe("cli/variadic-args", () => {
	it("works", () => new Promise(resolve => {
		const stdoutWrite = jest.fn((s: string) => process.stdout.write(s));
		program({
			name: "jarvis",
			commands: [command({
				identifiers: ["_"],
				arguments: [
					argument({
						type: t.string(),
						signatureName: "operation",
						variadicLength: 2
					}),
					argument({
						type: t.number(),
						signatureName: "a"
					}),
					argument({
						type: t.number(),
						signatureName: "b"
					})
				],
				action: ([operation, a, b]) => {
					expect(operation).toBe("do addition");
					resolve();
				}
			})],
			stdoutWrite
		}).takeArgv(["jarvis.js", "_", "do", "addition", "1", "2"])
	}))
})