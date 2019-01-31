import { AbstractLogCommand } from "../shared/log";

export class LogCommand extends AbstractLogCommand {
    public static description: string = "Show the core log";

    public static examples: string[] = [`$ ark core:log`];

    public getClass() {
        return LogCommand;
    }

    public getSuffix(): string {
        return "core";
    }
}
