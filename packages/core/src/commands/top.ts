import { list } from "../helpers/pm2";
import { BaseCommand } from "./command";

export class TopCommand extends BaseCommand {
    public static description: string = "List all core daemons";

    public static examples: string[] = [
        `List all core daemons
$ ark top
`,
    ];

    public static flags: Record<string, any> = {
        ...BaseCommand.flagsNetwork,
    };

    public async run(): Promise<void> {
        const { flags } = this.parse(TopCommand);

        list(flags.token as string);
    }
}
