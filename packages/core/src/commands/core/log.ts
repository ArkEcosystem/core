import { flags } from "@oclif/command";
import { AbstractLogCommand } from "../../shared/log";
import { BaseCommand } from "../command";

export class LogCommand extends AbstractLogCommand {
    public static description: string = "Show the core log";

    public static examples: string[] = [`$ ark core:log`];

    public static flags: Record<string, any> = {
        ...BaseCommand.flagsNetwork,
        error: flags.boolean({
            description: "only show error output",
        }),
    };

    public getClass() {
        return LogCommand;
    }

    public getSuffix(): string {
        return "core";
    }
}
