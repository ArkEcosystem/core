import { flags } from "@oclif/command";
import { BaseCommand } from "../command";
export declare class WalletCommand extends BaseCommand {
    static description: string;
    static flags: {
        quantity: import("@oclif/parser/lib/flags").IOptionFlag<number>;
        copy: import("@oclif/parser/lib/flags").IBooleanFlag<boolean>;
        write: import("@oclif/parser/lib/flags").IBooleanFlag<boolean>;
        host: flags.IOptionFlag<string>;
        portAPI: import("@oclif/parser/lib/flags").IOptionFlag<number>;
    };
    run(): Promise<Record<string, any>>;
}
