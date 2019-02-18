import cli from "cli-ux";
import pm2, { ProcessDescription } from "pm2";
import prompts from "prompts";
import { BaseCommand } from "../commands/command";

export abstract class AbstractStartCommand extends BaseCommand {
    public async run(): Promise<void> {
        const { flags } = await this.parseWithNetwork(this.getClass());

        return this.runProcess(flags);
    }

    public abstract getClass();

    protected abstract async runProcess(flags: Record<string, any>): Promise<void>;

    protected runWithPm2(options: any, flags: Record<string, any>) {
        const processName = options.name;
        const noDaemonMode = flags.daemon === false;

        this.createPm2Connection(() => {
            pm2.describe(processName, async (error, apps) => {
                if (error) {
                    this.error(error.message);
                }

                if (apps[0]) {
                    if (apps[0].pm2_env.status === "online") {
                        const response = await prompts({
                            type: "confirm",
                            name: "confirm",
                            message: "A process is already running, would you like to restart it?",
                        });

                        if (!response.confirm) {
                            this.warn(`The "${processName}" process has not been restarted.`);

                            pm2.disconnect();

                            process.exit();
                        }
                    }

                    cli.action.start(`Restarting ${processName}`);

                    pm2.reload(processName, error => {
                        pm2.disconnect();

                        if (error) {
                            this.error(error.message);
                        }

                        cli.action.stop();

                        process.exit();
                    });
                } else {
                    cli.action.start(`Starting ${processName}`);

                    pm2.start(
                        {
                            ...{
                                max_restarts: 5,
                                min_uptime: "5m",
                                kill_timeout: 30000,
                            },
                            ...options,
                        },
                        error => {
                            pm2.disconnect();

                            if (error) {
                                this.error(error.message);
                            }

                            cli.action.stop();

                            process.exit();
                        },
                    );
                }
            });
        }, noDaemonMode);
    }

    protected abortWhenRunning(processName: string, app: ProcessDescription): void {
        if (app && app.pm2_env.status === "online") {
            this.warn(`The "${processName}" process is already running.`);
            process.exit();
        }
    }
}
