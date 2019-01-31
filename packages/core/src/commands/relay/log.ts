import { flags } from "@oclif/command";
import { log } from "../../helpers/pm2";
import { AbstractLogCommand } from "../shared/log";

export class LogCommand extends AbstractLogCommand {
    public static description: string = "Show the relay log";

    public static examples: string[] = [`$ ark relay:log`];

    public getClass() {
        return LogCommand;
    }

    public getSuffix(): string {
        return "core-relay";
    }
}
