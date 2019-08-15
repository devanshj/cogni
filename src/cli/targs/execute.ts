import { Targs } from "./types";
import parseArgv from "./argv-parser";
import { t } from "./type-parser";
import { red, brightCyan, padded, grey } from "../utils";


const execute =  <A extends Targs.ArgumentTuple, O extends Targs.OptionRecord>(
    { command, argv: _argv, programName}: {
        command: Targs.Command<A, O>,
        argv: string[],
        programName: string
    }
) => {
    let argv = parseArgv(_argv.slice(2));
    let argvOriginal = { argument: [...argv.arguments], options: { ...argv.options } }
    let commandName = _argv[1];
    let parsedArgs = [] as string[];
    let parsedOptions = {} as { [K in string]: string };

    if ("-h" in argv.options || "--help" in argv.options) {
        println();
        printCommandSignature();
        println();
        for (let opt of Object.values(command.options)) {
            printOptionSignature(opt, "", false)
            println();
        }
        return;
    }

    for (let [i, argSpec] of command.arguments.entries()) {
        let parser = argSpec.type(argSpec.signatureName);
        let arg = argv.arguments[i] || null;
        let parsed = parser(arg);

        if (!parsed.isValid) {
            println();
            println(red(`[!] Error:`))
            println(`   In ${nth(i)} argument:`);
            println(`      ${parsed.error}`);
            println();
            println("Use -h for help");
            println();
            printCommandSignature();
            println();
            return;
        }

        parsedArgs.push(parsed.data);
        argv.arguments.shift();
    }

    if (argv.arguments.length > 0) {
        println();
        println(red(`[!] Error:`))
        println(`   You provided ${argv.arguments.length} extra argument${
            argv.arguments.length === 1 ? "" : "s"
        } (${argv.arguments.map(a => `${a}`).join(", ")})`);
        println();
        println("Use -h for help");
        println();
        printCommandSignature();
        println();
        return;
    }

    for (let [optKey, optSpec] of Object.entries(command.options)) {
        let matchingIdentifiers = optSpec
            .identifiers
            .filter(identifier => identifier in argv.options)

        if (matchingIdentifiers.length === 0) {
            continue;
        }

        if (matchingIdentifiers.length > 1) {
            println(red(`[!] Error:`))
            println(`   ${optSpec.identifiers.join(", ")} are aliases for each other you can only use one at a time`)
            println();
            println("Use -h for help");
            println();
            printOptionSignature(optSpec, matchingIdentifiers[0], true)
            println();
            return;
        }


        let identifier = matchingIdentifiers[0];
        let opt = identifier ? argv.options[identifier] : null;
        let parser = optSpec.type(optSpec.signatureName);
        let parsed = parser(opt);
        let isRequirementFulfilled = optSpec.requires.every(k => 
            command.options[k].identifiers.some(i => i in argvOriginal.options)
        );

        if (!isRequirementFulfilled) {
            println();
            println(red(`[!] Error:`));
            println(`   In option ${identifier}`);
            println(`      ${identifier} requires ${
                optSpec.requires.map(r => 
                    command.options[r].identifiers.join(" or ")
                ).join(" and ")
            }`);
            println();
            println("Use -h for help");
            println();
            return;
        }



        if (!parsed.isValid) {
            println(red(`[!] Error:`));
            println(`   In option ${identifier}`);
            println(`      ${parsed.error}`);
            println();
            println("Use -h for help");
            println();
            printOptionSignature(optSpec, identifier, true)
            println();
            return;
        }

        parsedOptions[optKey] = parsed.data;
        delete argv.options[identifier];
    }

    let unknownOpts = Object.keys(argv.options);
    if (unknownOpts.length > 0) {
        println();
        println(red(`[!] Error:`));
        println(`   Unknown option${
            unknownOpts.length === 1 ? "" : "s"
        }: ${Object.keys(argv.options).join(", ")}`)
        println();
        println("Use -h for help");
        println();
    }

    command.action(parsedArgs as any, parsedOptions as any);

    function printCommandSignature() {
        println(brightCyan(
            `${programName} ${commandName} ${
                command
                .arguments
                .map(a => t.signature(a.type)(a.signatureName))
                .join(" ")
            }`
        ))
        println(command.description);
        println(
            command.examples
            .map(e => e.replace(/\{\{identifier\}\}/g, commandName))
            .map(grey)
            .join("\n")
        );
    }

    function printOptionSignature(option: Targs.Option<any>, identifier: string, isForError = false) {
        println(brightCyan(
            wrap(
                option.identifiers.join("|") +
                (!t.isBoolean(option.type)
                    ? wrap(option.signatureName, " <", ">")
                    : ""),
                ...(t.isRequired(option.type)
                    ? []
                    : ["[", "]"])
            )
        ))
        if (option.description) println(option.description);
        let examples = 
            isForError
                ? option.parseErrorExamples.map(
                     e => e.replace(/\{\{identifier\}\}/g, identifier)
                )
                : option.examples;

        if (examples.length > 0) {
            println(
                examples
                .map(grey)
                .join("\n")
            );
        }
    }

}

const nth = (n: number, offset = 1) => `${n + offset}${
    n + offset === 1 ? "st" :
    n + offset === 2 ? "nd" :
    "th"
}`;

const print = (s: string) =>
    process.stdout.write(padded(s));

const println = (s: string = "") =>
    process.stdout.write(padded(s) + "\n");

const wrap = (x: string, p: string = "", s: string = "") => p + x + s;

const repeat = (s: string, n: number) =>
    Array.from({ length: n }, () => s).join("")

export default execute;