import { restart } from "../../helpers/pm2";
import { BaseCommand } from "../command";

export class RelayRestart extends BaseCommand {
    public static description: string = "Restart the relay";

    public static examples: string[] = [
        `Restart the relay
$ ark relay:restart
`,
    ];

    public async run(): Promise<void> {
        restart("ark-core-relay");
    }
}
