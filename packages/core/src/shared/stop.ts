import cli from "cli-ux";
import pm2 from "pm2";
import { BaseCommand } from "../commands/command";

export abstract class AbstractStopCommand extends BaseCommand {
    public async run(): Promise<void> {
        const { flags } = await this.parseWithNetwork(this.getClass());

        const processName = `${flags.token}-${this.getSuffix()}`;

        this.createPm2Connection(() => {
            const method = flags.daemon ? "delete" : "stop";

            cli.action.start(`Stopping ${processName}`);

            pm2[method](processName, error => {
                pm2.disconnect();

                cli.action.stop();

                if (error) {
                    if (error.message === "process name not found") {
                        this.warn(`The "${processName}" process does not exist.`);
                        return;
                    }

                    throw error;
                }
            });
        });
    }

    public abstract getClass();

    public abstract getSuffix(): string;
}
