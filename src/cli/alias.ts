import { command, argument, t, option } from "./targs";
import path from "path";
import { grey, println, red } from "./utils";
import toArgv from "./targs/to-argv";
import cogniProgram from ".";

const alias = command({
	identifiers: ["alias"],
	description: "Use aliases for frequently used commands",
	examples: [
		`$ cogni alias foo.py ${grey(`# in-build alias`)}`,
		`$ cogni alias something something ${grey(`# will use alias defined in cogni.config.js`)}`,
	],
	arguments: [
		argument({
			type: t.compose(t.string(), t.optional("")),
			signatureName: "identifier",
		})
	],
	options: {
		allowPossibleRecursion: option({
			identifiers: ["-r"],
			type: t.boolean()
		})
	},
	action: ([identifier], { allowPossibleRecursion }) => {
		let alias =
			getAliases()
			.find(alias =>
				typeof alias.match === "string"
					? alias.match === identifier
					: alias.match.test(identifier)
			);
		if (alias) {
			let argvString = alias.alias(identifier, ...identifier.match(alias.match)!.slice(1));
			let argv = toArgv(argvString);


			if (["run", "pipe"].includes(argv[0].trim())) {
				println();
				println(`Alias: cogni ${argvString}`);
				println();
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
		...((config || {}).aliases as Alias[] || []),
		...[
			["py", "python"],
			["js", "node"],
			["ts", "ts-node"],
		].map(([ext, p]) =>
			({
				match: new RegExp(`^(\\S+)\\.${ext}$(.*)`),
				alias: (s: string, fileBase: string, args: string) =>
					`run "${p} ${s} ${args}" -w "${fileBase}.py"`
			})
		), {
			match: /^(\S+)\.c(.*)/,
			alias: (s: string, fileBase: string, args: string) =>
				`run "./${fileBase} ${args}" -w "${fileBase}.c" -b "gcc -o ${fileBase} ${fileBase}.c"`
		}, {
			match: /^(\S+)\.java(.*)/,
			alias: (s: string, fileBase: string, args: string) =>
				`run "java ${fileBase} ${args}" -w "${fileBase}.java" -b "javac ${fileBase}.java"`
		}
	]
	
}

type Alias = {
	match: RegExp | string,
	alias: (s: string, ...ss: string[]) => string
};