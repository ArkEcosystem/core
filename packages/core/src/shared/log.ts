import cli from "cli-ux";
import pm2, { ProcessDescription } from "pm2";
import { Tail } from "tail";
import { BaseCommand } from "../commands/command";

export abstract class AbstractLogCommand extends BaseCommand {
    public async run(): Promise<void> {
        const { flags } = this.parse(this.getClass());

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

                const { pm2_env } = apps[0];
                const file = flags.error ? pm2_env.pm_err_log_path : pm2_env.pm_out_log_path;

                const log = new Tail(file);

                cli.action.start(`Waiting for ${file}`);

                log.on("line", data => {
                    console.log(data);

                    if (cli.action.running) {
                        cli.action.stop();
                    }
                });

                log.on("error", error => console.error("ERROR: ", error));
            });
        });
    }

    public abstract getClass();

    public abstract getSuffix(): string;
}
