import cli from "cli-ux";
import { BaseCommand } from "../commands/command";
import { processManager } from "../services/process-manager";

export abstract class AbstractRestartCommand extends BaseCommand {
    public async run(): Promise<void> {
        const { flags } = await this.parseWithNetwork(this.getClass());

        const processName = `${flags.token}-${this.getSuffix()}`;

        try {
            cli.action.start(`Restarting ${processName}`);

            processManager.restart(processName);
        } catch (error) {
            this.warn(`The "${processName}" process does not exist.`);

            process.exit();
        } finally {
            cli.action.stop();
        }
    }

    public abstract getClass();

    public abstract getSuffix(): string;
}
