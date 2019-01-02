import { restart } from "../../helpers/pm2";
import { BaseCommand } from "../command";

export class RestartCommand extends BaseCommand {
    public static description: string = "Restart the core";

    public static examples: string[] = [
        `Restart the core
$ ark core:restart
`,
    ];

    public async run(): Promise<void> {
        restart("ark-core");
    }
}
