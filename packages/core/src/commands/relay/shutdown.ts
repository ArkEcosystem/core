import { shutdown } from "../../pm2";
import { BaseCommand as Command } from "../command";

export class RelayShutdown extends Command {
    public static description = "Delete the relay daemon";

    public static examples = [`$ ark relay:shutdown`];

    public async run() {
        shutdown("ark-core-relay");
    }
}
