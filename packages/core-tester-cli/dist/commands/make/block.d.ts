import { Interfaces } from "@arkecosystem/crypto";
import { flags } from "@oclif/command";
import { BaseCommand } from "../command";
export declare class BlockCommand extends BaseCommand {
    static description: string;
    static flags: {
        number: import("@oclif/parser/lib/flags").IOptionFlag<number>;
        nonce: import("@oclif/parser/lib/flags").IOptionFlag<number>;
        transactions: import("@oclif/parser/lib/flags").IOptionFlag<number>;
        transactionAmount: flags.IOptionFlag<number>;
        transactionFee: flags.IOptionFlag<number>;
        passphrase: flags.IOptionFlag<string>;
        previousBlock: flags.IOptionFlag<string>;
        write: import("@oclif/parser/lib/flags").IBooleanFlag<boolean>;
        log: import("@oclif/parser/lib/flags").IBooleanFlag<boolean>;
        network: flags.IOptionFlag<string>;
        copy: import("@oclif/parser/lib/flags").IBooleanFlag<boolean>;
        host: flags.IOptionFlag<string>;
        portAPI: import("@oclif/parser/lib/flags").IOptionFlag<number>;
    };
    run(): Promise<Interfaces.IBlockJson[]>;
}
