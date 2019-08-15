import { program } from "./targs"
import run from "./run";
import { banner, bannerSmall } from "./banner";
import { padded, lines, brightCyan, grey } from "./utils";

program({
    name: "cogni",
    commands: [run],
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
            brightCyan("cogni run-preset"),
            "(coming soon) run presets for popular languages",
            grey("so you don't have to write -w and -b flags"),
            "",
            brightCyan("cogni pipe"),
            "(coming soon) pipe stdin to a process with hot reloading",
            ""
        )
    )
})
.takeArgv(process.argv.slice(1))