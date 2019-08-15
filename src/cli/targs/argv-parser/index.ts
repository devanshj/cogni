import { use } from "../../../utils";

const parseArgv =
    (argv: string[]) =>
        use(
            argv.reduce(
                ({ args, opts, skipOne }, arg, i) => 
                    skipOne ? { args, opts, skipOne: false } : {
                        args:
                            !arg.startsWith("-")
                                ? [...args, arg]   
                                : args,

                        ...use(argv[i+1]).as(optVal =>
                            arg.startsWith("-")
                                ? optVal
                                    ? optVal.startsWith("-")
                                        ? { opts: { ...opts, [arg]: "" }, skipOne: false }
                                        : { opts: { ...opts, [arg]: optVal }, skipOne: true }
                                    : { opts: { ...opts, [arg]: "" }, skipOne: false }
                                : { opts, skipOne }
                        )
                    }
                , {
                    args: [] as string[],
                    opts: {} as { [K in string]: string },
                    skipOne: false as boolean
                }
            )
        ).as(
            ({ args, opts }) => ({
                arguments: args,
                options: opts
            })
        );

export default parseArgv;
