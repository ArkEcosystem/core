import { BaseCommand } from "../command";

export abstract class AbstractStartCommand extends BaseCommand {
    public async run(): Promise<void> {
        const { flags } = this.parse(this.getClass());

        return flags.daemon ? this.runWithDaemon(flags) : this.runWithoutDaemon(flags);
    }

    public abstract getClass();

    protected abstract async runWithDaemon(flags: Record<string, any>): Promise<void>;
    protected abstract async runWithoutDaemon(flags: Record<string, any>): Promise<void>;
}
