import { AbstractLogCommand } from "../shared/log";

export class LogCommand extends AbstractLogCommand {
    public static description: string = "Show the forger log";

    public static examples: string[] = [`$ ark forger:log`];

    public getClass() {
        return LogCommand;
    }

    public getSuffix(): string {
        return "core-forger";
    }
}
