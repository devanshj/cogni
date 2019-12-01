import { command, argument, t, option } from "./targs";
import path from "path";
import { grey, red, stdoutFromProcess } from "./utils";
import toArgv from "./targs/to-argv";
import cogniProgram from ".";
import defaultConfig, { Config } from "./default-config";

const alias = command({
	identifiers: ["alias"],
	description: "Use aliases for frequently used commands",
	examples: [
		`$ cogni alias foo.py ${grey(`# in-build alias`)}`,
		`$ cogni alias something something ${grey(`# will use alias defined in cogni.config.js`)}`,
	],
	argvMiddleware: argv =>
		argv.map((x, i) =>
			x.trim() === "-r"
				? i === 0
					? x
					: "__COGNI_ALIAS-r"
				: x.replace(/^--/, "__COGNI_ALIAS--").replace(/^-/, "__COGNI_ALIAS-")
		),
	arguments: [
		argument({
			type: t.compose(t.string(), t.optional("")),
			signatureName: "identifier",
			variadicLength: Infinity
		})
	],
	options: {
		allowPossibleRecursion: option({
			identifiers: ["-r"],
			type: t.boolean()
		})
	},
	action: ([identifier], { allowPossibleRecursion }) => {
		identifier = identifier.replace(/__COGNI_ALIAS/g, "");
		let alias =
			getAliases()
			.reverse()
			.find(alias =>
				typeof alias.match === "string"
					? alias.match === identifier
					: alias.match.test(identifier)
			);
		const { println } = stdoutFromProcess(process)

		if (alias) {
			let argvString = alias.alias(identifier, ...identifier.match(alias.match)!.slice(1));
			let argv = toArgv(argvString);
			
			
			if (["run", "pipe"].includes(argv[0].trim())) {
				println();
				println(`Alias: cogni ${argvString}`);
				cogniProgram.takeArgv(["cogni", ...argv]);
			} else if (argv[0].trim() === "alias") {
				if (allowPossibleRecursion) {
					cogniProgram.takeArgv(["cogni", ...argv]);
				} else {
					println();
					println(red(`[!] Error:`));
					println(`   Aliasing "${identifier}" to "cogni ${argvString}" might result in infinite recursion`);
					println(`   You can't alias an alias to another alias`);
					println(`   If you are sure it won't cause recursion you can use -r flag to alias it anyway`)
					println();
				}
			} else {
				println();
				println(`Alias: cogni ${argvString}`);
				println(red(`[!] Error:`));
				println(`   Command "${argv[0].trim()}" does not exist`);
				println(`   Use cogni -h for help`);
				println();
			}
		} else {
			println();
			println(red(`[!] Error:`));
			println(`   Couldn't find an alias for "${identifier}"`);
			println(`   You can create one in "cogni.config.js" file in your working directory`);
			println();
		}
	}
})
export default alias;

const getAliases = () => {
	let config: any | null;
	try {
		config = require(
			path.join(process.cwd(), "/cogni.config.js")
		);
	} catch {
		config = null;
	}
	
	return [
		...defaultConfig.aliases,
		...((config || {}).aliases as Config["aliases"] || [])
	]
}