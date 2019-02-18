import cli from "cli-ux";
import pm2 from "pm2";
import { BaseCommand } from "../commands/command";

export abstract class AbstractStopCommand extends BaseCommand {
    public async run(): Promise<void> {
        const { flags } = this.parse(this.getClass());

        const processName = `${flags.token}-${this.getSuffix()}`;

        this.createPm2Connection(() => {
            const method = flags.daemon ? "delete" : "stop";

            pm2[method](processName, error => {
                pm2.disconnect();

                if (error) {
                    if (error.message === "process name not found") {
                        this.warn(`The "${processName}" process does not exist.`);
                        return;
                    }

                    throw error;
                }

                cli.action.start(`Stopping ${processName}`);
                cli.action.stop();
            });
        });
    }

    public abstract getClass();

    public abstract getSuffix(): string;
}
