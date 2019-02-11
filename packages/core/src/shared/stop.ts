import { flags } from "@oclif/command";
import { BaseCommand } from "../commands/command";
import { shutdown, stop } from "../helpers/pm2";

export abstract class AbstractStopCommand extends BaseCommand {
    public static flags: Record<string, any> = {
        ...BaseCommand.flagsNetwork,
        daemon: flags.boolean({
            char: "d",
            description: "stop the process or daemon",
        }),
    };

    public async run(): Promise<void> {
        const { flags } = this.parse(this.getClass());

        const processName = `${flags.token}-${this.getSuffix()}`;

        flags.daemon ? shutdown(processName) : stop(processName);
    }

    public abstract getClass();

    public abstract getSuffix(): string;
}
