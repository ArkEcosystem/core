import { restart } from "../../helpers/pm2";
import { BaseCommand } from "../command";

export class RestartCommand extends BaseCommand {
    public static description: string = "Restart the forger";

    public static examples: string[] = [
        `Restart the forger
$ ark forger:restart
`,
    ];

    public async run(): Promise<void> {
        restart("ark-core-forger");
    }
}
