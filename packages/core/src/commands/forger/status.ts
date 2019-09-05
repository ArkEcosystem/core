import { flagsNetwork } from "../../common/flags";
import { AbstractStatusCommand } from "../../shared/status";
import { CommandFlags } from "../../types";

export class StatusCommand extends AbstractStatusCommand {
    public static description = "Show the forger status";

    public static examples: string[] = [`$ ark forger:status`];

    public static flags: CommandFlags = {
        ...flagsNetwork,
    };

    public getClass() {
        return StatusCommand;
    }

    public getSuffix(): string {
        return "forger";
    }
}
