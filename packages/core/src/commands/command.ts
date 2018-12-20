import { Command } from "commander";

export abstract class AbstractCommand {
    constructor(readonly options: Command) {}

    protected isInterface(): boolean {
        return this.isInterface();
    }
    protected isInteractive(): boolean {
        return !this.isInterface();
    }
}
