import Table from "cli-table3";

import { CommandFlags } from "../../types";
import { renderTable } from "../../utils";
import { BaseCommand } from "../command";

export class PathsCommand extends BaseCommand {
    public static description = "Get all of the environment paths";

    public static examples: string[] = [
        `List all environment paths
$ ark env:paths
`,
    ];

    public static flags: CommandFlags = {
        ...BaseCommand.flagsNetwork,
    };

    public async run(): Promise<void> {
        const { paths } = await this.parseWithNetwork(PathsCommand);

        renderTable(["Type", "Path"], (table: Table.Table) => {
            for (const [type, path] of Object.entries(paths)) {
                // @ts-ignore
                table.push([type, path]);
            }
        });
    }
}
