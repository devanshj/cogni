const toArgv = (_argv: string) => {
	let cursor = 0;
	let argv = [];

	let currentArg = "";
	let quoteStack = { "\"": 0, "\'": 0 };

	while (cursor < _argv.length) {
		let char = _argv[cursor];
		let nextChar = _argv[cursor+1] as string | undefined;

		if (char === "\\") {
			currentArg += nextChar === undefined ? "" : nextChar;
			cursor += 2;
			continue;
		} 
		
		if (char === "\"" || char === "'") {
			let offset = quoteStack[char];
			quoteStack[char] += offset > 0 ? -1 : +1;
			cursor++;
			continue;
		}

		if (char === " ") {
			if (quoteStack["'"] > 0 || quoteStack["\""] > 0) {
				currentArg += char;
				cursor++;
				continue;		
			}

			argv.push(currentArg);
			currentArg = "";
			cursor++;
			continue;
		}

		currentArg += char;
		cursor++;
	}
	argv.push(currentArg);
	argv = argv.filter(x => x !== "");

	return argv;
}
export default toArgv;