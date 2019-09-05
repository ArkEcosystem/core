import Command from "@oclif/command";

import { parseWithNetwork } from "../common/parser";
import { CommandFlags } from "../types";

export abstract class AbstractStartCommand extends Command {
    public async run(): Promise<void> {
        const { flags } = await parseWithNetwork(this.parse(this.getClass()));

        return this.runProcess(flags);
    }

    public abstract getClass();

    protected abstract async runProcess(flags: CommandFlags): Promise<void>;
}
