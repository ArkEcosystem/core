import { flags } from "@oclif/command";
import { log } from "../../helpers/pm2";
import { BaseCommand as Command } from "../command";

export class CoreLog extends Command {
    public static description = "Show the core log";

    public static examples = [`$ ark core:log`];

    public static flags = {
        error: flags.boolean({
            char: "e",
            description: "only show error output from the daemon",
        }),
    };
    public async run() {
        const { flags } = this.parse(CoreLog);

        log("ark-core", flags.error);
    }
}
