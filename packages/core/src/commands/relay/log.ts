import { flags } from "@oclif/command";

import { flagsNetwork } from "../../common/flags";
import { AbstractLogCommand } from "../../shared/log";
import { CommandFlags } from "../../types";

export class LogCommand extends AbstractLogCommand {
    public static description = "Show the relay log";

    public static examples: string[] = [`$ ark relay:log`];

    public static flags: CommandFlags = {
        ...flagsNetwork,
        error: flags.boolean({
            description: "only show error output",
        }),
        lines: flags.integer({
            description: "number of lines to tail",
            default: 15,
        }),
    };

    public getClass() {
        return LogCommand;
    }

    public getSuffix(): string {
        return "relay";
    }
}
