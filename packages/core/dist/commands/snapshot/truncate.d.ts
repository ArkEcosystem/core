import { BaseCommand } from "../command";
export declare class TruncateCommand extends BaseCommand {
    static description: string;
    run(): Promise<void>;
}
