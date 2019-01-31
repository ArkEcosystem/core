import { flags } from "@oclif/command";
import { log } from "../../helpers/pm2";
import { BaseCommand } from "../command";

export abstract class AbstractLogCommand extends BaseCommand {
    public static flags: Record<string, any> = {
        error: flags.boolean({
            char: "e",
            description: "only show error output",
        }),
    };

    public async run(): Promise<void> {
        const { flags } = this.parse(this.getClass());

        log(`${flags.token}-${this.getSuffix()}`, flags.error as boolean);
    }

    public abstract getClass();

    public abstract getSuffix(): string;
}
