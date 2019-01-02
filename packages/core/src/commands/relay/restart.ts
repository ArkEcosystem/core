import { restart } from "../../helpers/pm2";
import { BaseCommand as Command } from "../command";

export class RelayRestart extends Command {
    public static description = "Restart the relay";

    public static examples = [
        `Restart the relay
$ ark relay:restart
`,
    ];

    public async run() {
        restart("ark-core-relay");
    }
}
