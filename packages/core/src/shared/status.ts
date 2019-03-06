import { dato } from "@faustbrian/dato";
import Table from "cli-table3";
import prettyBytes from "pretty-bytes";
import prettyMs from "pretty-ms";
import { BaseCommand } from "../commands/command";
import { processManager } from "../process-manager";
import { ProcessDescription } from "../types";
import { renderTable } from "../utils";

export abstract class AbstractStatusCommand extends BaseCommand {
    public async run(): Promise<void> {
        const { flags } = await this.parseWithNetwork(this.getClass());

        const processName = `${flags.token}-${this.getSuffix()}`;

        this.abortMissingProcess(processName);

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
                prettyMs(dato().diff(app.pm2_env.pm_uptime)),
                `${app.monit.cpu}%`,
                prettyBytes(app.monit.memory),
            ]);
        });
    }

    public abstract getClass();

    public abstract getSuffix(): string;
}
