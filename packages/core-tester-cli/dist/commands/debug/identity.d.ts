import { flags } from "@oclif/command";
import { BaseCommand } from "../command";
export declare class IdentityCommand extends BaseCommand {
    static description: string;
    static flags: {
        data: flags.IOptionFlag<string>;
        type: flags.IOptionFlag<string>;
        network: flags.IOptionFlag<string>;
        log: import("@oclif/parser/lib/flags").IBooleanFlag<boolean>;
        copy: import("@oclif/parser/lib/flags").IBooleanFlag<boolean>;
    };
    run(): Promise<void>;
}
