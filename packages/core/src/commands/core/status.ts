import { AbstractStatusCommand } from "../../shared/status";
import { BaseCommand } from "../command";

export class StatusCommand extends AbstractStatusCommand {
    public static description: string = "Show the core status";

    public static examples: string[] = [`$ ark core:status`];

    public static flags: Record<string, any> = {
        ...BaseCommand.flagsNetwork,
    };

    public getClass() {
        return StatusCommand;
    }

    public getSuffix(): string {
        return "core";
    }
}
