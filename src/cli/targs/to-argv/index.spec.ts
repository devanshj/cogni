import toArgv from "."

describe("toArgv", () => {
	test.each<[string, string[]]>([
		[`abc pqr`, ["abc", "pqr"]],
		[`abc   pqr`, ["abc", "pqr"]],
		[`abc \\  pqr`, ["abc", " ", "pqr"]],
		[`abc "pqr xyz"`, ["abc", "pqr xyz"]],
		[`abc "pqr \\\" xyz"`, ["abc", "pqr \" xyz"]]
	])("%s", (input, output) => {
		expect(toArgv(input)).toStrictEqual(output);
	})
})