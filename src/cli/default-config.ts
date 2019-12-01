export default {
	aliases: [
		...[
			["py", "python"],
			["js", "node"],
			["ts", "ts-node"],
		].map(([ext, p]) =>
			({
				match: new RegExp(`^(.*?)(\\S+)\\.${ext}(.*)$`),
				alias: (_: string, cogniArgs: string, fileBase: string, args: string) =>
					`run "${p} ${fileBase}.${ext}${args}" -w "${fileBase}.${ext}" ${cogniArgs}`
			})
		),
		{
			match: /^(.*?)(\S+)\.c(.*)$/,
			alias: (_: string, cogniArgs: string, fileBase: string, args: string) =>
				`run "./${fileBase}${args}" -w "${fileBase}.c" -b "gcc -o ${fileBase} ${fileBase}.c" ${cogniArgs}`
		},
		{
			match: /^(.*?)(\S+)\.java(.*)$/,
			alias: (_: string, cogniArgs: string, fileBase: string, args: string) =>
				`run "java ${fileBase}${args}" -w "${fileBase}.java" -b "javac ${fileBase}.java" ${cogniArgs}`
		}
	]
} as Config;

export type Config = {
	aliases: Array<{
		match: RegExp | string,
		alias: (s: string, ...ss: string[]) => string
	}>
};