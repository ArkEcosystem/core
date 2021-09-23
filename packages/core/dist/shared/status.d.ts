import { BaseCommand } from "../commands/command";
export declare abstract class AbstractStatusCommand extends BaseCommand {
    run(): Promise<void>;
    abstract getClass(): any;
    abstract getSuffix(): string;
}
