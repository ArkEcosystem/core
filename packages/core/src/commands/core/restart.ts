import { restart } from "../../pm2";
import { BaseCommand as Command } from "../command";

export class CoreRestart extends Command {
    public static description = "Restart the core";

    public static examples = [`$ ark core:restart`];

    public async run() {
        restart("ark-core");
    }
}
