import { BaseCommand } from "../commands/command";

export abstract class AbstractRunCommand extends BaseCommand {
    protected abstract getClass();
    protected abstract getSuffix(): string;

    protected async getFlags(): Promise<Record<string, any>> {
        const { flags } = await super.parseWithNetwork(this.getClass());
        flags.suffix = this.getSuffix();
        return flags;
    }
}
