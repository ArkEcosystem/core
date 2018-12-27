import { restart } from "../../pm2";
import Command from "../command";

export class ForgerRestart extends Command {
    public static description = "Restart the relay";

    public static examples = [`$ ark relay:restart`];

    public async run() {
        restart("ark-core-relay");
    }
}
