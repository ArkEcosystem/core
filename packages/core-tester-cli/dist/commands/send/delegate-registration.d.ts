import { SendCommand } from "../../shared/send";
export declare class DelegateRegistrationCommand extends SendCommand {
    static description: string;
    static flags: {
        delegateFee: import("@oclif/command/lib/flags").IOptionFlag<number>;
        passphrase: import("@oclif/command/lib/flags").IOptionFlag<string>;
        secondPassphrase: import("@oclif/command/lib/flags").IOptionFlag<string>;
        nonce: import("@oclif/parser/lib/flags").IOptionFlag<number>;
        number: import("@oclif/parser/lib/flags").IOptionFlag<number>;
        amount: import("@oclif/command/lib/flags").IOptionFlag<number>;
        transferFee: import("@oclif/command/lib/flags").IOptionFlag<number>;
        skipProbing: import("@oclif/parser/lib/flags").IBooleanFlag<boolean>;
        waves: import("@oclif/parser/lib/flags").IOptionFlag<number>;
        host: import("@oclif/command/lib/flags").IOptionFlag<string>;
        portAPI: import("@oclif/parser/lib/flags").IOptionFlag<number>;
    };
    protected getCommand(): any;
    protected createWalletsWithBalance(flags: Record<string, any>): Promise<any[]>;
    protected signTransactions(flags: Record<string, any>, wallets: Record<string, any>): Promise<any[]>;
    protected expectBalances(transactions: any, wallets: any): Promise<void>;
    protected verifyTransactions(transactions: any, wallets: any): Promise<void>;
    private knockUsername;
}
