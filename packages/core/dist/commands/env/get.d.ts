import { CommandFlags } from "../../types";
import { BaseCommand } from "../command";
export declare class GetCommand extends BaseCommand {
    static description: string;
    static examples: string[];
    static flags: CommandFlags;
    static args: Array<{
        name: string;
        required: boolean;
        hidden: boolean;
    }>;
    run(): Promise<void>;
}
