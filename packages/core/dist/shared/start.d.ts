import { BaseCommand } from "../commands/command";
import { CommandFlags, ProcessOptions } from "../types";
export declare abstract class AbstractStartCommand extends BaseCommand {
    run(): Promise<void>;
    abstract getClass(): any;
    protected abstract runProcess(flags: CommandFlags): Promise<void>;
    protected runWithPm2(options: ProcessOptions, flags: CommandFlags): Promise<void>;
}
