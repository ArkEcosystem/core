import { AbstractStartCommand } from "../../shared/start";
import { CommandFlags } from "../../types";
export declare class StartCommand extends AbstractStartCommand {
    static description: string;
    static examples: string[];
    static flags: CommandFlags;
    getClass(): typeof StartCommand;
    protected runProcess(flags: CommandFlags): Promise<void>;
}
