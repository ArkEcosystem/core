import Table from "cli-table3";
import envfile from "envfile";
import expandHomeDir from "expand-home-dir";
import { existsSync } from "fs-extra";
import { BaseCommand } from "../command";

export class ListCommand extends BaseCommand {
    public static description: string = "get a value from the environment";

    public static examples: string[] = [
        `List all environment variables
$ ark env:list
`,
    ];

    public static flags: Record<string, any> = {
        ...BaseCommand.flagsNetwork,
        ...BaseCommand.flagsNetwork,
    };

    public async run(): Promise<void> {
        const { flags } = this.parse(ListCommand);

        const { config } = this.getPaths(flags.token, flags.network);
        const envFile = `${config}/.env`;

        if (!existsSync(envFile)) {
            throw new Error(`No environment file found at ${envFile}`);
        }

        const env = envfile.parseFileSync(envFile);

        const table = new Table({ chars: { mid: "", "left-mid": "", "mid-mid": "", "right-mid": "" } });

        for (const [key, value] of Object.entries(env)) {
            // @ts-ignore
            table.push([key, value]);
        }

        console.log(table.toString());
    }
}
