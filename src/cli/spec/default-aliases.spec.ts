import defaultConfig from "../default-config"
import toArgv from "../targs/to-argv";

describe("cli/default-aliases", () => {
	it(".py works", () => {
		let identifier = "-x -y foo.py -z   abc"
		let alias =
			defaultConfig.aliases
			.reverse()
			.find(alias =>
				typeof alias.match === "string"
					? alias.match === identifier
					: alias.match.test(identifier)
			)!;

		expect(
			toArgv(
				alias.alias(
					identifier,
					...identifier.match(alias.match)!.slice(1)
				)
			)
		).toStrictEqual([
			"run",
			"python foo.py -z   abc",
			"-w",
			"foo.py",
			"-x",
			"-y"
		])
	})
})