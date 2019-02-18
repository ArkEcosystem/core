import Table from "cli-table3";
import { renderTable } from "../../utils";
import { BaseCommand } from "../command";

export class PathsCommand extends BaseCommand {
    public static description: string = "Get all of the environment paths";

    public static examples: string[] = [
        `List all environment paths
$ ark env:paths
`,
    ];

    public static flags: Record<string, any> = {
        ...BaseCommand.flagsNetwork,
    };

    public async run(): Promise<void> {
        renderTable(["Type", "Path"], async (table: Table.Table) => {
            const { paths } = await this.parseWithNetwork(PathsCommand);

            for (const [type, path] of Object.entries(paths)) {
                // @ts-ignore
                table.push([type, path]);
            }
        });
    }
}
