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
                this.abortUnknownProcess(processName);
                this.abortRunningProcess(processName);
            }

            cli.action.start(`Starting ${processName}`);

            processManager.start(options, flags.daemon === false);
        } catch (error) {
            error.stderr ? this.error(`${error.message}: ${error.stderr}`) : this.error(error.message);
        } finally {
            cli.action.stop();
        }
    }
}
