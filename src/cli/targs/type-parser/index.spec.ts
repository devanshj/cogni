import { t } from ".";
import { Targs } from "../types";

describe("t", () => {
    
	test("t.string()", () => {

		let signatureName = "foo";
		let parse = t.string()(signatureName);

		expect(parse(null))
		.toStrictEqual({ isValid: false, error: `${signatureName} is required` })

		expect(parse(" "))
		.toStrictEqual({ isValid: false, error: `${signatureName} is required` })
	})

	test("t.number()", () => {
		let signatureName = "foo";
		let parse = t.number()(signatureName);

		expect(parse(null))
		.toStrictEqual({ isValid: false, error: `${signatureName} is required` })

		expect(parse(" "))
		.toStrictEqual({ isValid: false, error: `${signatureName} is required` })

		expect(parse("abc"))
		.toStrictEqual({ isValid: false, error: `${signatureName} should be a number, "abc" is not a number` })

		expect(parse("123"))
		.toStrictEqual({ isValid: true, data: 123 })

		expect(parse("0b10"))
		.toStrictEqual({ isValid: true, data: 0b10 })
	})

	test("t.boolean()", () => {
		let signatureName = "foo";
		let parse = t.boolean()(signatureName);

		expect(parse(null))
		.toStrictEqual({ isValid: true, data: false })

		expect(parse(" "))
		.toStrictEqual({ isValid: true, data: true })

		expect(parse("abc"))
		.toStrictEqual({ isValid: false, error: `${signatureName} takes no arguments` })
	})

	test("t.array()(t.number())", () => {
		let signatureName = "fruities";
		let inner = jest.fn(t.number())
		let parse = t.array()(inner)(signatureName);

		expect(parse(null))
		.toStrictEqual({ isValid: false, error: `${signatureName} is required` })
		expect(inner.mock.calls.length).toBe(0);

		expect(parse("1, , 2"))
		.toStrictEqual({ isValid: true, data: [1, 2]})
		expect(inner.mock.calls.length).toBe(2);

		expect(parse("1, , a"))
		.toStrictEqual({ isValid: false, error: `2nd fruity (" a") should be a number, " a" is not a number`})
		expect(inner.mock.calls.length).toBe(2 + 2);
	})

	describe("t.minLength", () => {
		test("t.minLength(3)", () => {
			let signatureName = "fruities";
			let parse = t.minLength(3)(t.array()(t.number()))(signatureName);
      
			expect(parse("1, , 2"))
			.toStrictEqual({ isValid: false, error: `There should be at least 3 fruities`})
		})

		test("t.minLength(1)", () => {
			let signatureName = "fruities";
			let parse = t.minLength(1)(t.array()(t.number()))(signatureName);
      
			expect(parse(","))
			.toStrictEqual({ isValid: false, error: `There should be at least 1 fruity`})
		})
	})

	describe("t.optional", () => {
		test("t.optional()(t.number())", () => {
			let signatureName = "foo";
			let inner = jest.fn(t.number())
			let parse = t.optional()(inner)(signatureName);
    
			expect(parse(null))
			.toStrictEqual({ isValid: true, data: undefined })
    
			expect(parse("abc"))
			.toStrictEqual({ isValid: false, error: `${signatureName} should be a number, "abc" is not a number` })
    
			expect(parse("123"))
			.toStrictEqual({ isValid: true, data: 123 })
		})
    
		test("t.optional(defaultValue)(t.number())", () => {
			let signatureName = "foo";
			let inner = jest.fn(t.number())
			let defaultValue = 100;
			let parse = t.optional(defaultValue)(inner)(signatureName);
    
			expect(parse(null))
			.toStrictEqual({ isValid: true, data: defaultValue })
    
			expect(parse("abc"))
			.toStrictEqual({ isValid: false, error: `${signatureName} should be a number, "abc" is not a number` })
    
			expect(parse("123"))
			.toStrictEqual({ isValid: true, data: 123 })
		})
	})

	describe("t.isRequired", () => {
		test.each<[string, Targs.ParserConstructor<any>, boolean]>([
			["t.string()", t.string(), true],
			["t.number()", t.number(), true],
			["t.boolean()", t.boolean(), false],
			["t.optional()(t.string())", t.optional()(t.string()), false],
			["t.optional()(t.number())", t.optional()(t.number()), false],
			["t.optional()(t.boolean())", t.optional()(t.boolean()), false]
		])("t.isRequired(%s)", (_, parser, isRequired) => {
			expect(t.isRequired(parser)).toBe(isRequired)
		})
	})

	describe("t.isBoolean", () => {

		test.each<[string, Targs.ParserConstructor<any>, boolean]>([
			["t.string()", t.string(), false],
			["t.number()", t.number(), false],
			["t.boolean()", t.boolean(), true],
			["t.optional()(t.string())", t.optional()(t.string()), false],
			["t.optional()(t.number())", t.optional()(t.number()), false],
			["t.optional()(t.boolean())", t.optional()(t.boolean()), true]
		])("t.isBoolean(%s)", (_, parser, isBoolean) => {
			expect(t.isBoolean(parser)).toBe(isBoolean)
		})
	})

	test("t.signature", () => {
        
		expect(
			t.signature(
				t.string()
			)("foo")
		).toBe("<foo>")

		expect(
			t.signature(
				t.optional()(
					t.string()
				)
			)("foo")
		).toBe("[foo]")

		expect(
			t.signature(
				t.boolean()
			)("foo")
		).toBe("")

		expect(
			t.signature(
				t.optional()(
					t.boolean()
				)
			)("foo")
		).toBe("")
	})
})