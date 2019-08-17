import { Targs } from "./types";
import execute from "./execute";

export * from "./types"

export const program = ({ name, commands, noCommandHelp }: Targs.ProgramConstructor) => ({
	takeArgv: (argv: string[]) => {
		let command = commands.find(c => c.identifiers.includes(argv[1]));
		if (!command) {
			process.stdout.write(noCommandHelp());
			return;
		}
		execute({ command, argv, programName: name });
	}
});

export const command =
	<A extends Targs.ArgumentTuple, O extends Targs.OptionRecord>
		(command: Targs.Command<A, O>) => {
			Object.entries(command.options).forEach(([key, opt]) => opt.signatureName = opt.signatureName || key)
			return command;
		};

export const argument =
	<T>(argument: Targs.Argument<T>) => argument;

export const option =
	<T>(option: PartialExcept<Targs.Option<T>, "identifiers" | "type">): Targs.Option<T> => ({
		...{
			description: "",
			examples: [],
			parseErrorExamples: [],
			requires: [],
			signatureName: ""
		},
		...option
	});

type PartialExcept<T, K extends keyof T> =
	& { [P in Exclude<keyof T, K>]+?: T[P] }
	& { [P in  K]: T[P] }


export { t } from "./type-parser";