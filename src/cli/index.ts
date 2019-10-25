import { program } from "./targs"
import run from "./run";
import alias from "./alias";
import { banner, bannerSmall } from "./banner";
import { padded, lines, brightCyan } from "./utils";

const cogniProgram = program({
	name: "cogni",
	commands: [run, alias],
	noCommandHelp: () => padded(
		lines(
			(process.stdout.columns || 60) > 60
				? banner
				: bannerSmall,
			"",
			"(use cogni <tool> --help for usage)",
			"",
			brightCyan("cogni run"),
			"run process with hot reloading & interactive stdin",
			"",
			brightCyan("cogni alias"),
			"Use default aliases and aliases in cogni.config.js",
			"",
			brightCyan("cogni pipe"),
			"(coming soon) pipe stdin to a process with hot reloading",
			""
		)
	)
});
export default cogniProgram;