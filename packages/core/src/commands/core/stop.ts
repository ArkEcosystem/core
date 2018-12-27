import { stop } from "../../pm2";
import Command from "../command";

export class CoreStop extends Command {
    public static description = "Stop the core";

    public static examples = [`$ ark core:stop`];

    public async run() {
        stop("ark-core");
    }
}
