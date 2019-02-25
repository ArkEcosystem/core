import cli from "cli-ux";
import { Tail } from "tail";
import { BaseCommand } from "../commands/command";
import { processManager } from "../services/process-manager";

export abstract class AbstractLogCommand extends BaseCommand {
    public async run(): Promise<void> {
        const { flags } = await this.parseWithNetwork(this.getClass());

        const processName = `${flags.token}-${this.getSuffix()}`;

        if (!processManager.exists(processName)) {
            this.warn(`The "${processName}" process is not running.`);
            return;
        }

        const { pm2_env } = processManager.describe(processName);

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
    }

    public abstract getClass();

    public abstract getSuffix(): string;
}
