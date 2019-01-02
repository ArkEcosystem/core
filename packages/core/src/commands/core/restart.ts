import { restart } from "../../helpers/pm2";
import { BaseCommand as Command } from "../command";

export class CoreRestart extends Command {
    public static description = "Restart the core";

    public static examples = [
        `Restart the core
$ ark core:restart
`,
    ];

    public async run() {
        restart("ark-core");
    }
}
