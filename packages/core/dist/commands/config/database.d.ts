import { CommandFlags } from "../../types";
import { BaseCommand } from "../command";
export declare class DatabaseCommand extends BaseCommand {
    static description: string;
    static examples: string[];
    static flags: CommandFlags;
    private static readonly validFlags;
    run(): Promise<void>;
    private hasValidFlag;
    private conform;
}
