import cli from "cli-ux";
import { BaseCommand } from "../commands/command";
import { processManager } from "../process-manager";

export abstract class AbstractRestartCommand extends BaseCommand {
    public async run(): Promise<void> {
        const { flags } = await this.parseWithNetwork(this.getClass());

        const processName = `${flags.token}-${this.getSuffix()}`;

        try {
            this.abortMissingProcess(processName);
            this.abortStoppedProcess(processName);

            cli.action.start(`Restarting ${processName}`);

            processManager.restart(processName);
        } catch (error) {
            error.stderr ? this.error(`${error.message}: ${error.stderr}`) : this.error(error.message);
        } finally {
            cli.action.stop();
        }
    }

    public abstract getClass();

    public abstract getSuffix(): string;
}
