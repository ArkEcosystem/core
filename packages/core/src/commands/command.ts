import { Command } from "commander";

export abstract class AbstractCommand {
    constructor(readonly options: Command) {}

    protected isInterface(): boolean {
        return !this.isInteractive();
    }

    protected isInteractive(): boolean {
        return !!this.options.interactive;
    }
}
