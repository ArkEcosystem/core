import { AbstractStopCommand } from "../../shared/stop";
import { CommandFlags } from "../../types";
export declare class StopCommand extends AbstractStopCommand {
    static description: string;
    static examples: string[];
    static flags: CommandFlags;
    getClass(): typeof StopCommand;
    getSuffix(): string;
}
