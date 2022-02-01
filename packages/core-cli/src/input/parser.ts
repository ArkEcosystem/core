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
    public static parseArgv(args: string[]) {
        const { _: argv, $0, ...flags } = yargs(args, { count: ["v"] });

        return { args: argv, flags };
    }
}
