import { log } from "../../pm2";
import Command from "../command";

export class CoreLog extends Command {
    public static description = "Show the core log";

    public static examples = [`$ ark core:log`];

    public async run() {
        log("ark-core");
    }
}
