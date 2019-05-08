import { dato } from "@faustbrian/dato";
import { ProcessDescription } from "@faustbrian/foreman";
import Table from "cli-table3";
import prettyBytes from "pretty-bytes";
import prettyMs from "pretty-ms";
import { processManager } from "../process-manager";
import { CommandFlags } from "../types";
import { renderTable } from "../utils";
import { BaseCommand } from "./command";

export class TopCommand extends BaseCommand {
    public static description: string = "List all core daemons";

    public static examples: string[] = [
        `List all core daemons
$ ark top
`,
    ];

    public static flags: CommandFlags = {
        ...BaseCommand.flagsNetwork,
    };

    public async run(): Promise<void> {
        const { flags } = await this.parseWithNetwork(TopCommand);

        const processes: ProcessDescription[] = processManager
            .list()
            .filter((p: ProcessDescription) => p.name.startsWith(flags.token));

        if (!processes || !Object.keys(processes).length) {
            this.warn("No processes are running.");
            return;
        }

        renderTable(["ID", "Name", "Version", "Status", "Uptime", "CPU", "RAM"], (table: Table.Table) => {
            for (const process of processes) {
                // @ts-ignore
                table.push([
                    process.pid,
                    process.name,
                    // @ts-ignore
                    process.pm2_env.version,
                    process.pm2_env.status,
                    // @ts-ignore
                    prettyMs(dato().diff(process.pm2_env.pm_uptime)),
                    `${process.monit.cpu}%`,
                    prettyBytes(process.monit.memory),
                ]);
            }
        });
    }
}
