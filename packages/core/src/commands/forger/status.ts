import { AbstractStatusCommand } from "../../shared/status";
import { CommandFlags } from "../../types";
import { BaseCommand } from "../command";

export class StatusCommand extends AbstractStatusCommand {
    public static description: string = "Show the forger status";

    public static examples: string[] = [`$ ark forger:status`];

    public static flags: CommandFlags = {
        ...BaseCommand.flagsNetwork,
    };

    public getClass() {
        return StatusCommand;
    }

    public getSuffix(): string {
        return "forger";
    }
}
