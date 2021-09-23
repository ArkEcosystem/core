import { CommandFlags } from "../../types";
import { BaseCommand } from "../command";
export declare class RestoreCommand extends BaseCommand {
    static description: string;
    static flags: CommandFlags;
    run(): Promise<void>;
}
