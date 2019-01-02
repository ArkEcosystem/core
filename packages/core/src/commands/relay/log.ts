import { flags } from "@oclif/command";
import { log } from "../../pm2";
import Command from "../command";

export class RelayLog extends Command {
    public static description = "Show the relay log";

    public static examples = [`$ ark relay:log`];

    public static flags = {
        error: flags.boolean({ char: "e", description: "..." }),
    };

    public async run() {
        const { flags } = this.parse(RelayLog);

        log("ark-core-relay", flags.error);
    }
}
