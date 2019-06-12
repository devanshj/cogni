import program from "commander";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { spawn } from "child_process";
import { watch } from "chokidar"
import app from "../run/terminal";

let padding = Array.from({ length: 25 }).fill(" ").join("");

program
	.name("cogni-run")
	.option("-f --file <file-path>",
		["file to be run" + 
		"out of the box support for .js, .ts, .py, .c, .cpp",
		"runner can be used for unsupported languages"]
		.reduce((s, x, i) => 
			i === 0
				? s + x
				: s + "\n" + padding + x
			, ""
		)
	)
	.option("-w --watch <watch-glob>", "glob to watch, defaults to file to be run")
	.option("-r --runner <runner>", "executable to which filePath is passed as arg")
	.version("1.0.1")
	.parse(process.argv);

program.on("--help", () => {
	console.log(`
Examples:
	$ cogni-run -f main.py
	- runs main.py
	- uses preset python
		- watches main.py for file changes
	
	$ cogni-run --file main.c --preset gcc --watch .
		- compiles main.c to main
		- runs main
		- watches "." that is the current dir for changes`)
});

(async () => {
	let { file: filePath, watch: watchGlob } = program;

	if (!filePath) {
		console.log("File not provided. Use --help for usage.");
		return;
	}

	try {
		await promisify(fs.access)(filePath, fs.constants.F_OK)
	} catch {
		console.log(`${filePath} does not exist`);
		return;
	}
	
	let stats = await promisify(fs.stat)(filePath);
	if (!stats.isFile()) {
		console.log(`${filePath} is not a file`);
		return;
	}

	let runners = new Map([
		["js", "node"],
		["ts", "ts-node"],
		["py", "python"],
		["c", "gcc"],
		["cpp", "g++"]
	]);
	
	let fileExt = path.extname(filePath).substring(1);
	let runner = runners.get(fileExt);

	if (!runner) {
		console.log([
			`Runner is not set out of the box for *.${fileExt}.`,
			`Set it via --runner, use --help for usage.`
		].join("\n"));
		return;
	}

	let { refresh } = await app({
		processSpawner: () => spawn(runner!, [filePath])
	})

	if (!watchGlob) {
		watchGlob = filePath;
	}
	watch(watchGlob).on("change", refresh);
	
})();