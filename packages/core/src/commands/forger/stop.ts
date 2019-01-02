import { stop } from "../../pm2";
import { BaseCommand as Command } from "../command";

export class ForgerStop extends Command {
    public static description = "Stop the forger";

    public static examples = [`$ ark forger:stop`];

    public async run() {
        stop("ark-core-forger");
    }
}
