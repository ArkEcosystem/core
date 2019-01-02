import { shutdown } from "../../pm2";
import Command from "../command";

export class ForgerShutdown extends Command {
    public static description = "Delete the forger daemon";

    public static examples = [`$ ark forger:shutdown`];

    public async run() {
        shutdown("ark-core-forger");
    }
}
