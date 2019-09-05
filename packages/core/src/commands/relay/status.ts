import { flagsNetwork } from "../../common/flags";
import { AbstractStatusCommand } from "../../shared/status";
import { CommandFlags } from "../../types";

export class StatusCommand extends AbstractStatusCommand {
    public static description = "Show the relay status";

    public static examples: string[] = [`$ ark relay:status`];

    public static flags: CommandFlags = {
        ...flagsNetwork,
    };

    public getClass() {
        return StatusCommand;
    }

    public getSuffix(): string {
        return "relay";
    }
}
