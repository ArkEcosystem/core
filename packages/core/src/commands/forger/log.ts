import { flags } from "@oclif/command";
import { log } from "../../pm2";
import Command from "../command";

export class ForgerLog extends Command {
    public static description = "Show the forger log";

    public static examples = [`$ ark forger:log`];

    public static flags = {
        error: flags.boolean({
            char: "e",
            description: "only show error output from the daemon",
        }),
    };

    public async run() {
        const { flags } = this.parse(ForgerLog);

        log("ark-core-forger", flags.error);
    }
}
