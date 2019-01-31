import { restart } from "../../helpers/pm2";
import { BaseCommand } from "../command";

export class RestartCommand extends BaseCommand {
    public static description: string = "Restart the relay";

    public static examples: string[] = [
        `Restart the relay
$ ark relay:restart
`,
    ];

    public static flags: Record<string, any> = {
        ...BaseCommand.flagsNetwork,
    };

    public async run(): Promise<void> {
        const { flags } = this.parse(RestartCommand);

        restart(`${flags.token}-core-relay`);
    }
}
