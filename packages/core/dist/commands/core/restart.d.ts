import { AbstractRestartCommand } from "../../shared/restart";
import { CommandFlags } from "../../types";
export declare class RestartCommand extends AbstractRestartCommand {
    static description: string;
    static examples: string[];
    static flags: CommandFlags;
    getClass(): typeof RestartCommand;
    getSuffix(): string;
}
