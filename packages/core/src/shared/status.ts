import Command from "@oclif/command";
import { ProcessDescription } from "@typeskrift/foreman";
import Table from "cli-table3";
import dayjs from "dayjs";
import prettyBytes from "pretty-bytes";
import prettyMs from "pretty-ms";

import { parseWithNetwork } from "../common/parser";
import { abortMissingProcess } from "../common/process";
import { processManager } from "../common/process-manager";
import { renderTable } from "../common/utils";

export abstract class AbstractStatusCommand extends Command {
    public async run(): Promise<void> {
        const { flags } = await parseWithNetwork(this.parse(this.getClass()));

        const processName = `${flags.token}-${this.getSuffix()}`;

        abortMissingProcess(processName);

        renderTable(["ID", "Name", "Version", "Status", "Uptime", "CPU", "RAM"], (table: Table.Table) => {
            const app: ProcessDescription = processManager.describe(processName);

            // @ts-ignore
            table.push([
                app.pid,
                app.name,
                // @ts-ignore
                app.pm2_env.version,
                app.pm2_env.status,
                // @ts-ignore
                prettyMs(dayjs().diff(app.pm2_env.pm_uptime)),
                `${app.monit.cpu}%`,
                prettyBytes(app.monit.memory),
            ]);
        });
    }

    public abstract getClass();

    public abstract getSuffix(): string;
}
