import { BaseCommand } from "../commands/command";

export abstract class AbstractStartCommand extends BaseCommand {
    public async run(): Promise<void> {
        const { flags } = this.parse(this.getClass());

        if (!flags.network) {
            await this.getNetwork(flags);
        }

        if (flags.daemon) {
            delete flags.daemon;

            return this.runWithDaemon(flags);
        }

        return this.runWithoutDaemon(flags);
    }

    public abstract getClass();

    protected abstract async runWithDaemon(flags: Record<string, any>): Promise<void>;
    protected abstract async runWithoutDaemon(flags: Record<string, any>): Promise<void>;
}
