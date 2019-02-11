import { BaseCommand } from "../commands/command";
import { log } from "../helpers/pm2";

export abstract class AbstractLogCommand extends BaseCommand {
    public async run(): Promise<void> {
        const { flags } = this.parse(this.getClass());

        log(`${flags.token}-${this.getSuffix()}`, flags.error as boolean);
    }

    public abstract getClass();

    public abstract getSuffix(): string;
}
