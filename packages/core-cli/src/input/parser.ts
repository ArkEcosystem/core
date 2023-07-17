import yargs from "yargs-parser";

/**
 * @export
 * @class InputParser
 */
export class InputParser {
    /**
     * @static
     * @param {string[]} args
     * @returns
     * @memberof InputParser
     */
    public static parseArgv(args: string[]): { args: string[]; flags: yargs.Arguments } {
        const parsed: yargs.Arguments = yargs(args, { count: ["v"] });


        const argv = parsed._.map((argument) => argument.toString());

        // @ts-ignore
        delete parsed._;

        return { args: argv, flags: parsed };
    }
}
