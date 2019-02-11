import { AbstractLogCommand } from "../../shared/log";

export class LogCommand extends AbstractLogCommand {
    public static description: string = "Show the relay log";

    public static examples: string[] = [`$ ark relay:log`];

    public getClass() {
        return LogCommand;
    }

    public getSuffix(): string {
        return "relay";
    }
}
