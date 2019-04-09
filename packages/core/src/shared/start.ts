import cli from "cli-ux";

import { BaseCommand } from "../commands/command";
import { processManager } from "../process-manager";
import { CommandFlags, ProcessOptions } from "../types";

export abstract class AbstractStartCommand extends BaseCommand {
    public async run(): Promise<void> {
        const { flags } = await this.parseWithNetwork(this.getClass());

        flags.suffix = this.getSuffix();

        return this.runProcess(flags);
    }

    public abstract getClass();

    protected abstract async runProcess(flags: CommandFlags): Promise<void>;

    protected abstract getSuffix(): string;

    protected async runWithPm2(options: ProcessOptions, flags: CommandFlags) {
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
