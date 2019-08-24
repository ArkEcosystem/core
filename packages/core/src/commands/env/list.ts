import Table from "cli-table3";
import envfile from "envfile";
import { existsSync } from "fs-extra";
import { CommandFlags } from "../../types";
import { renderTable } from "../../utils";
import { BaseCommand } from "../command";

export class ListCommand extends BaseCommand {
    public static description = "List all environment variables";

    public static examples: string[] = [
        `List all environment variables
$ ark env:list
`,
    ];

    public static flags: CommandFlags = {
        ...BaseCommand.flagsNetwork,
    };

    public async run(): Promise<void> {
        const { paths } = await this.parseWithNetwork(ListCommand);

        const envFile = `${paths.config}/.env`;

        if (!existsSync(envFile)) {
            this.error(`No environment file found at ${envFile}`);
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
