import Table from "cli-table3";
import dayjs from "dayjs-ext";
import pm2 from "pm2";
import prettyBytes from "pretty-bytes";
import prettyMs from "pretty-ms";
import { BaseCommand } from "./command";

export class TopCommand extends BaseCommand {
    public static description: string = "List all core daemons";

    public static examples: string[] = [
        `List all core daemons
$ ark top
`,
    ];

    public static flags: Record<string, any> = {
        ...BaseCommand.flagsNetwork,
    };

    public async run(): Promise<void> {
        const { flags } = this.parse(TopCommand);

        this.createPm2Connection(() => {
            pm2.list((error, processDescriptionList) => {
                pm2.disconnect();

                if (error) {
                    this.error(error.message);
                }

                const table = new Table({
                    head: ["ID", "Name", "Version", "Status", "Uptime", "CPU", "RAM"],
                    chars: { mid: "", "left-mid": "", "mid-mid": "", "right-mid": "" },
                });

                const processList = Object.values(processDescriptionList).filter(p =>
                    p.name.startsWith(flags.token as string),
                );

                for (const process of processList) {
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

                console.log(table.toString());
            });
        });
    }
}
