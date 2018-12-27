import { log } from "../../pm2";
import Command from "../command";

export class RelayLog extends Command {
    public static description = "Show the relay log";

    public static examples = [`$ ark relay:log`];

    public async run() {
        log("ark-core-relay");
    }
}
