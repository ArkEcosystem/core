import { flags } from "@oclif/command";
import { SendCommand } from "../../shared/send";
export declare class HtlcLockCommand extends SendCommand {
    static description: string;
    static flags: {
        htlcLockFee: flags.IOptionFlag<number>;
        expiration: import("@oclif/parser/lib/flags").IOptionFlag<number>;
        passphrase: flags.IOptionFlag<string>;
        secondPassphrase: flags.IOptionFlag<string>;
        nonce: import("@oclif/parser/lib/flags").IOptionFlag<number>;
        number: import("@oclif/parser/lib/flags").IOptionFlag<number>;
        amount: flags.IOptionFlag<number>;
        transferFee: flags.IOptionFlag<number>;
        skipProbing: import("@oclif/parser/lib/flags").IBooleanFlag<boolean>;
        waves: import("@oclif/parser/lib/flags").IOptionFlag<number>;
        host: flags.IOptionFlag<string>;
        portAPI: import("@oclif/parser/lib/flags").IOptionFlag<number>;
    };
    protected getCommand(): any;
    protected createWalletsWithBalance(flags: Record<string, any>): Promise<any[]>;
    protected signTransactions(flags: Record<string, any>, wallets: Record<string, any>): Promise<any[]>;
    protected expectBalances(transactions: any, wallets: any): Promise<void>;
    protected verifyTransactions(transactions: any, wallets: any): Promise<void>;
}
