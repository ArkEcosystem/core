import { AbstractLogCommand } from "../../shared/log";
import { CommandFlags } from "../../types";
export declare class LogCommand extends AbstractLogCommand {
    static description: string;
    static examples: string[];
    static flags: CommandFlags;
    getClass(): typeof LogCommand;
    getSuffix(): string;
}
