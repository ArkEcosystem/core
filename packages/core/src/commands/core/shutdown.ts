import { shutdown } from "../../pm2";
import Command from "../command";

export class CoreShutdown extends Command {
    public static description = "Delete the core daemon";

    public static examples = [`$ ark core:shutdown`];

    public async run() {
        shutdown("ark-core-core");
    }
}
