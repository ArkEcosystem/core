import Command from "@oclif/command";
import Table from "cli-table3";

import { flagsNetwork } from "../../common/flags";
import { parseWithNetwork } from "../../common/parser";
import { renderTable } from "../../common/utils";
import { CommandFlags } from "../../types";

export class PathsCommand extends Command {
    public static description = "Get all of the environment paths";

    public static examples: string[] = [
        `List all environment paths
$ ark env:paths
`,
    ];

    public static flags: CommandFlags = {
        ...flagsNetwork,
    };

    public async run(): Promise<void> {
        const { paths } = await parseWithNetwork(this.parse(PathsCommand));

        renderTable(["Type", "Path"], (table: Table.Table) => {
            for (const [type, path] of Object.entries(paths)) {
                // @ts-ignore
                table.push([type, path]);
            }
        });
    }
}
