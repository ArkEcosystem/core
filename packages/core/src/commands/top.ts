import Command from "@oclif/command";
import { ProcessDescription } from "@typeskrift/foreman";
import Table from "cli-table3";
import dayjs from "dayjs";
import prettyBytes from "pretty-bytes";
import prettyMs from "pretty-ms";

import { abort } from "../common/cli";
import { flagsNetwork } from "../common/flags";
import { parseWithNetwork } from "../common/parser";
import { processManager } from "../common/process-manager";
import { renderTable } from "../common/utils";
import { CommandFlags } from "../types";

export class TopCommand extends Command {
    public static description = "List all core daemons";

    public static examples: string[] = [
        `List all core daemons
    $ ark top
    `,
    ];

    public static flags: CommandFlags = {
        ...flagsNetwork,
    };

    public async run(): Promise<void> {
        const { flags } = await parseWithNetwork(this.parse(TopCommand));

        const processes: ProcessDescription[] = processManager
            .list()
            .filter((p: ProcessDescription) => p.name.startsWith(flags.token));

        if (!processes || !Object.keys(processes).length) {
            abort("No processes are running.");
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
                    prettyMs(dayjs().diff(process.pm2_env.pm_uptime)),
                    `${process.monit.cpu}%`,
                    prettyBytes(process.monit.memory),
                ]);
            }
        });
    }
}
