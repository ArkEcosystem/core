import { flags } from "@oclif/command";
import { log } from "../../helpers/pm2";
import { BaseCommand } from "../command";

export class CoreLog extends BaseCommand {
    public static description: string = "Show the core log";

    public static examples: string[] = [`$ ark core:log`];

    public static flags: Record<string, any> = {
        error: flags.boolean({
            char: "e",
            description: "only show error output from the daemon",
        }),
    };
    public async run(): Promise<void> {
        const { flags } = this.parse(CoreLog);

        log("ark-core", flags.error as boolean);
    }
}
