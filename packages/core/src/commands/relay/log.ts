import { flags } from "@oclif/command";
import { log } from "../../helpers/pm2";
import { BaseCommand } from "../command";

export class LogCommand extends BaseCommand {
    public static description: string = "Show the relay log";

    public static examples: string[] = [`$ ark relay:log`];

    public static flags: Record<string, any> = {
        error: flags.boolean({
            char: "e",
            description: "only show error output from the daemon",
        }),
    };

    public async run(): Promise<void> {
        const { flags } = this.parse(LogCommand);

        log("ark-core-relay", flags.error as boolean);
    }
}
