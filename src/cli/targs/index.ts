import { Targs } from "./types";
import execute from "./execute";

export * from "./types"

export const program = ({
	name, commands, noCommandHelp = () => "", stdoutWrite
}: PartialOnly<Targs.ProgramConstructor, "noCommandHelp">) => ({
	takeArgv: (argv: string[]) => {
		let command = commands.find(c => c.identifiers.includes(argv[1]));
		if (!command) {
			stdoutWrite(noCommandHelp());
			return;
		}
		execute({ command, argv, programName: name, stdoutWrite });
	}
});

export const command =
	<A extends Targs.ArgumentTuple, O extends Targs.OptionRecord>
		(_command: PartialExcept<Targs.Command<A, O>, "identifiers">) => {
			let command: Targs.Command<A, O>  = {
				description: "",
				examples: [],
				arguments: [] as any as A,
				options: {} as O,
				action: () => {},
				argvMiddleware: x => x,
				..._command
			};
			
			Object.entries(command.options)
			.forEach(([key, opt]) => opt.signatureName = opt.signatureName || key)
			return command;
		};

export const argument =
	<T>(argument: PartialExcept<Targs.Argument<T>, "type" | "signatureName">) => ({
		variadicLength: 1,
		...argument
	});

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
	& { [P in K]: T[P] }

type PartialOnly<T, K extends keyof T> =
	& { [P in K]+?: T[P] }
	& { [P in Exclude<keyof T, K>]: T[P] }

export { t } from "./type-parser";