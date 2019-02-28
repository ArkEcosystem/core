import cli from "cli-ux";
import prompts from "prompts";
import { BaseCommand } from "../commands/command";
import { ProcessState } from "../enums";
import { processManager } from "../process-manager";
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
                if (processManager.hasUnknownState(processName)) {
                    this.warn(`The "${processName}" process has entered an unknown state, aborting restart.`);
                    return;
                }

                if (processManager.hasErrored(processName)) {
                    this.warn(`The "${processName}" process has previously errored, aborting restart.`);
                    return;
                }

                if (processManager.isOnline(processName)) {
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

                cli.action.start(`Restarting ${processName}`);

                processManager.restart(processName);
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
        if (processManager.isOnline(processName)) {
            this.warn(`The "${processName}" process is already running.`);
            process.exit();
        }
    }
}
