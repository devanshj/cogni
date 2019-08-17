export namespace Targs {

	export type ProgramConstructor = {
		name: string,
		commands: Command<any, any>[],
		noCommandHelp: () => string
	}

	export type Command<A extends ArgumentTuple, O extends OptionRecord> = {
		identifiers: [string, ...string[]],
		description: string,
		examples: string[],
		arguments: A,
		options: O,
		action: Action<A, O>
	}
	export type AnyCommand = Command<any, any>;

	export type Argument<T> = {
		type: ParserConstructor<T>,
		signatureName: string
	}
	export type ArgumentTuple = Argument<any>[] | [Argument<any>];

	export type Option<T> = {
		identifiers: [string, ...string[]]
		type: ParserConstructor<T>,
		signatureName: string,
		description: string,
		examples: string[],
		parseErrorExamples: string[],
		requires: string[]
	};
	export type OptionRecord = Record<string, Option<any>>;

	
	export type Parser<T> = 
		(arg: string | null) => ParserResult<T>;
	
	export type ParserResult<T> = 
		| { isValid: true, data: T }
		| { isValid: false, error: string };

	export type ParserConstructor<T> =
		(signature: string) =>
			Parser<T>;

	export type HigherOrderParserConstructor<A, B> =
		(_: ParserConstructor<A>) => ParserConstructor<B>;
	
	
	export type Action<A extends ArgumentTuple, O extends OptionRecord> =
		(
			args: {
				[I in keyof A]:
					A[I] extends Argument<infer T>
						? T
						: never
			},
			opts: {
				[K in keyof O]:
					O[K] extends Option<infer T>
						? T
						: never
			}
		) => void;
}

