import { stop } from "../../pm2";
import Command from "../command";

export class RelayStop extends Command {
    public static description = "Stop the relay";

    public static examples = [`$ ark relay:stop`];

    public async run() {
        stop("ark-core-relay");
    }
}
