import { restart } from "../../pm2";
import { BaseCommand as Command } from "../command";

export class ForgerRestart extends Command {
    public static description = "Restart the forger";

    public static examples = [
        `Restart the forger
$ ark forger:restart
`,
    ];

    public async run() {
        restart("ark-core-forger");
    }
}
