import { Targs } from "../types";
import { singularize, UnshiftN } from "../utils";
import { use } from "../../../utils";

export const t = {
	string: (): Targs.ParserConstructor<string> =>
		name => arg =>
			arg === null || arg.trim() === ""
				? { isValid: false, error: `${name} is required` }
				: { isValid: true, data: arg },

	boolean: (): Targs.ParserConstructor<boolean> =>
		name => arg =>
			arg === null
				? { isValid: true, data: false } :
			arg.trim() === ""
				? { isValid: true, data: true } :
			{ isValid: false, error: `${name} takes no arguments` },

	number: (): Targs.ParserConstructor<number> =>
		name => arg =>
			arg === null || arg.trim() === ""
				? { isValid: false, error: `${name} is required` } :
			Number.isNaN(Number(arg)) 
				? { isValid: false, error: `${name} should be a number, "${arg}" is not a number` } :
			{ isValid: true, data: Number(arg) },

	optional: ((defaultValue: any) => 
		(innerParser: any) => (name: any) => (arg: any) =>
			arg === null
				? { isValid: true, data: defaultValue }
				: innerParser(name)(arg)
	) as Optional,

	array: (delimeter: RegExp | string = ",") =>
		<T>(innerParser: Targs.ParserConstructor<T>): Targs.ParserConstructor<T[]> =>
			name => arg =>
				arg === null || arg.trim() === ""
					? { isValid: false, error: `${name} is required` }
					: arg.split(delimeter).filter(item => item.trim() !== "").reduce(
						(parsed, item, i) =>
							parsed.isValid === false
								? parsed
								: use(
									innerParser(`${i + 1}${
										i == 0 ? "st" :
										i == 1 ? "nd" :
										"th"
									} ${singularize(name)} ("${item}")`)(item)
								).as(innerParsed =>
									innerParsed.isValid === true
										? { isValid: true, data: [...parsed.data, innerParsed.data] }
										: { isValid: false, error: innerParsed.error }
								),
						{ isValid: true, data: [] } as Targs.ParserResult<T[]>
					),

	minLength: <L extends number>(minLength: L) =>
		<T>(innerParser: Targs.ParserConstructor<T[]>): Targs.ParserConstructor<UnshiftN<L, T[], T>> =>
			name => arg =>
				use(innerParser(name)(arg))
				.as(innerParsed =>
					innerParsed.isValid
						? innerParsed.data.length >= minLength
							? innerParsed as Targs.ParserResult<UnshiftN<L, T[], T>>
							: {
								isValid: false,
								error: `There should be at least ${minLength} ${
									minLength === 1
										? singularize(name)
										: name
								}`
							}
						: innerParsed
				),

	compose: (
		(base: Targs.ParserConstructor<any>, ...modifiers: Targs.HigherOrderParserConstructor<any, any>[]) =>
			modifiers.reduce((r, fn) => fn(r), base)
	) as Compose,

	isRequired:
		<T>(parser: Targs.ParserConstructor<T>) =>
			!parser("")(null).isValid,

	isBoolean:
		<T>(parser: Targs.ParserConstructor<T>) =>
			use(parser("foo")("xyz")).as(r =>
				!r.isValid && r.error === "foo takes no arguments"
			),

	signature:
		<T>(parser: Targs.ParserConstructor<T>) =>
			(name: string) =>
				t.isBoolean(parser) ? "" :
				t.isRequired(parser) ? `<${name}>` :
				`[${name}]`
}

type Optional = {
	<T>(): Targs.HigherOrderParserConstructor<T, T | undefined>
	<T>(defaultValue: T): Targs.HigherOrderParserConstructor<T, T>
}


export type Compose = {

	<A>(
		base: Targs.ParserConstructor<A>
	): Targs.ParserConstructor<A>

	<A, B>(
		base: Targs.ParserConstructor<A>,
		f: Targs.HigherOrderParserConstructor<A, B>
	): Targs.ParserConstructor<B>

	<A, B, C>(
		base: Targs.ParserConstructor<A>,
		f: Targs.HigherOrderParserConstructor<A, B>,
		g: Targs.HigherOrderParserConstructor<B, C>
	): Targs.ParserConstructor<C>

	<A, B, C, D>(
		base: Targs.ParserConstructor<A>,
		f: Targs.HigherOrderParserConstructor<A, B>,
		g: Targs.HigherOrderParserConstructor<B, C>,
		h: Targs.HigherOrderParserConstructor<C, D>
	): Targs.ParserConstructor<D>

	<A, B, C, D, E>(
		base: Targs.ParserConstructor<A>,
		f: Targs.HigherOrderParserConstructor<A, B>,
		g: Targs.HigherOrderParserConstructor<B, C>,
		h: Targs.HigherOrderParserConstructor<C, D>,
		i: Targs.HigherOrderParserConstructor<D, E>
	): Targs.ParserConstructor<D>
}
