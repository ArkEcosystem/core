import cli from "cli-ux";

import { BaseCommand } from "../commands/command";
import { processManager } from "../process-manager";

export abstract class AbstractStopCommand extends BaseCommand {
    public async run(): Promise<void> {
        const { flags } = await this.parseWithNetwork(this.getClass());

        const processName = `${flags.token}-${this.getSuffix()}`;

        try {
            this.abortMissingProcess(processName);
            this.abortUnknownProcess(processName);
            this.abortStoppedProcess(processName);

            cli.action.start(`Stopping ${processName}`);

            processManager[flags.daemon ? "delete" : "stop"](processName);
        } catch (error) {
            this.error(error.message);
        } finally {
            cli.action.stop();
        }
    }

    public abstract getClass();

    public abstract getSuffix(): string;
}
