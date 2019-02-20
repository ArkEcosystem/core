import Table from "cli-table3";
import dayjs from "dayjs-ext";
import pm2, { ProcessDescription } from "pm2";
import prettyBytes from "pretty-bytes";
import prettyMs from "pretty-ms";
import { BaseCommand } from "../commands/command";
import { renderTable } from "../utils";

export abstract class AbstractStatusCommand extends BaseCommand {
    public async run(): Promise<void> {
        const { flags } = await this.parseWithNetwork(this.getClass());

        const processName = `${flags.token}-${this.getSuffix()}`;

        this.createPm2Connection(() => {
            pm2.describe(processName, (error, apps) => {
                pm2.disconnect();

                if (error) {
                    this.error(error.message);
                }

                if (!apps[0]) {
                    this.warn(`The "${processName}" process is not running.`);
                    return;
                }

                renderTable(["ID", "Name", "Version", "Status", "Uptime", "CPU", "RAM"], (table: Table.Table) => {
                    const process: ProcessDescription = apps[0];

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
                });
            });
        });
    }

    public abstract getClass();

    public abstract getSuffix(): string;
}
