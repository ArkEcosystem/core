import { AbstractStatusCommand } from "../../shared/status";
import { CommandFlags } from "../../types";
export declare class StatusCommand extends AbstractStatusCommand {
    static description: string;
    static examples: string[];
    static flags: CommandFlags;
    getClass(): typeof StatusCommand;
    getSuffix(): string;
}
