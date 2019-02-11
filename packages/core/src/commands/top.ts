import { list } from "../helpers/pm2";
import { BaseCommand } from "./command";

export class TopCommand extends BaseCommand {
    public static description: string = "get a value from the environment";

    public static examples: string[] = [
        `List all environment variables
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
