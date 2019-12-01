import alias from "../alias"

describe("alias-options-escape", () => {
	it("works", () => {
		expect(alias.argvMiddleware(
			["-r", "foo.py", "--xyz", "pqr", "-r"]
		)).toStrictEqual(
			["-r", "foo.py", "__COGNI_ALIAS--xyz", "pqr", "__COGNI_ALIAS-r"]
		)
	})
})