import Table from "cli-table3";
import { BaseCommand } from "../command";
import { networks } from "@arkecosystem/crypto";

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
        console.log(networks);
        const paths = await this.getPaths(this.parse(PathsCommand).flags);

        const table = new Table({ head: ["Type", "Path"] });

        for (const [type, path] of Object.entries(paths)) {
            // @ts-ignore
            table.push([type, path]);
        }

        console.log(table.toString());
    }
}
