import Table from "cli-table3";
import envfile from "envfile";
import { existsSync } from "fs-extra";
import { renderTable } from "../../utils";
import { BaseCommand } from "../command";

export class ListCommand extends BaseCommand {
    public static description: string = "List all environment variables";

    public static examples: string[] = [
        `List all environment variables
$ ark env:list
`,
    ];

    public static flags: Record<string, any> = {
        ...BaseCommand.flagsNetwork,
    };

    public async run(): Promise<void> {
        const { flags } = this.parse(ListCommand);
        const { config } = await this.getPaths(flags);

        const envFile = `${config}/.env`;

        if (!existsSync(envFile)) {
            throw new Error(`No environment file found at ${envFile}`);
        }

        renderTable(["Key", "Value"], (table: Table.Table) => {
            const env = envfile.parseFileSync(envFile);

            for (const [key, value] of Object.entries(env)) {
                // @ts-ignore
                table.push([key, value]);
            }
        });
    }
}
