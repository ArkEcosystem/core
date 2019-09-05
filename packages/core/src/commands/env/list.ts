import Command from "@oclif/command";
import Table from "cli-table3";
import envfile from "envfile";
import { existsSync } from "fs-extra";

import { flagsNetwork } from "../../common/flags";
import { parseWithNetwork } from "../../common/parser";
import { renderTable } from "../../common/utils";
import { CommandFlags } from "../../types";

export class ListCommand extends Command {
    public static description = "List all environment variables";

    public static examples: string[] = [
        `List all environment variables
$ ark env:list
`,
    ];

    public static flags: CommandFlags = {
        ...flagsNetwork,
    };

    public async run(): Promise<void> {
        const { paths } = await parseWithNetwork(this.parse(ListCommand));

        const envFile = `${paths.config}/.env`;

        if (!existsSync(envFile)) {
            this.warn(`No environment file found at ${envFile}.`);
            return;
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
