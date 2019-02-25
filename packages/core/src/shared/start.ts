import cli from "cli-ux";
import prompts from "prompts";
import { BaseCommand } from "../commands/command";
import { processManager } from "../services/process-manager";
import { CommandFlags, ProcessDescription } from "../types";

export abstract class AbstractStartCommand extends BaseCommand {
    public async run(): Promise<void> {
        const { flags } = await this.parseWithNetwork(this.getClass());

        return this.runProcess(flags);
    }

    public abstract getClass();

    protected abstract async runProcess(flags: CommandFlags): Promise<void>;

    protected async runWithPm2(options: any, flags: CommandFlags) {
        const processName = options.name;

        try {
            if (processManager.exists(processName)) {
                const app: ProcessDescription = processManager.describe(processName);

                if (app.pm2_env.status === "online") {
                    cli.action.start(`Restarting ${processName}`);

                    const response = await prompts({
                        type: "confirm",
                        name: "confirm",
                        message: "A process is already running, would you like to restart it?",
                    });

                    if (!response.confirm) {
                        this.warn(`The "${processName}" process has not been restarted.`);
                        return;
                    }
                }
            } else {
                cli.action.start(`Starting ${processName}`);

                processManager.start(options, flags.daemon === false);
            }
        } catch (error) {
            this.error(error.message);
        } finally {
            cli.action.stop();
        }
    }

    protected abortWhenRunning(processName: string): void {
        const app: ProcessDescription = processManager.describe(processName);

        if (app && app.pm2_env.status === "online") {
            this.warn(`The "${processName}" process is already running.`);
            process.exit();
        }
    }
}
