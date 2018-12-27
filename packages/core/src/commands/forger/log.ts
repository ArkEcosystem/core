import { log } from "../../pm2";
import Command from "../command";

export class ForgerLog extends Command {
    public static description = "Show the forger log";

    public static examples = [`$ ark forger:log`];

    public async run() {
        log("ark-core-relay");
    }
}
