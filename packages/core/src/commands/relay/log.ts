import { flags } from "@oclif/command";
import { log } from "../../helpers/pm2";
import { BaseCommand as Command } from "../command";

export class RelayLog extends Command {
    public static description = "Show the relay log";

    public static examples = [`$ ark relay:log`];

    public static flags = {
        error: flags.boolean({
            char: "e",
            description: "only show error output from the daemon",
        }),
    };

    public async run() {
        const { flags } = this.parse(RelayLog);

        log("ark-core-relay", flags.error);
    }
}
