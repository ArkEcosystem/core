import cli from "cli-ux";
import pm2 from "pm2";
import { BaseCommand } from "../commands/command";

export abstract class AbstractRestartCommand extends BaseCommand {
    public async run(): Promise<void> {
        const { flags } = this.parse(this.getClass());

        const processName = `${flags.token}-${this.getSuffix()}`;

        this.createPm2Connection(() => {
            cli.action.start(`Restarting ${processName}. Please wait`);

            pm2.reload(processName, error => {
                pm2.disconnect();

                if (error) {
                    if (error.message === "process name not found") {
                        this.warn(`The "${processName}" process does not exist. Failed to restart!`);
                    } else {
                        throw error;
                    }
                }

                cli.action.stop();
            });
        });
    }

    public abstract getClass();

    public abstract getSuffix(): string;
}
