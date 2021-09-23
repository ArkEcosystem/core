import { CommandFlags } from "../types";
import { BaseCommand } from "./command";
export declare class UpdateCommand extends BaseCommand {
    static description: string;
    static flags: CommandFlags;
    run(): Promise<void>;
    private performUpdate;
    private hasRestartFlag;
}
