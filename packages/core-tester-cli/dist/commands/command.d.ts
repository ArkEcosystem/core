import { Utils } from "@arkecosystem/crypto";
import Command, { flags } from "@oclif/command";
import { HttpClient } from "../http-client";
import { Signer } from "../signer";
export declare abstract class BaseCommand extends Command {
    static flagsConfig: {
        host: flags.IOptionFlag<string>;
        portAPI: import("@oclif/parser/lib/flags").IOptionFlag<number>;
    };
    static flagsSend: {
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
    static flagsDebug: {
        network: flags.IOptionFlag<string>;
        log: import("@oclif/parser/lib/flags").IBooleanFlag<boolean>;
        copy: import("@oclif/parser/lib/flags").IBooleanFlag<boolean>;
    };
    protected api: HttpClient;
    protected signer: Signer;
    protected constants: Record<string, any>;
    protected get network(): number;
    protected make(command: any): Promise<any>;
    protected makeOffline(command: any): any;
    protected sendTransaction(transactions: any[]): Promise<Record<string, any>>;
    protected knockTransaction(id: string): Promise<boolean>;
    protected knockBalance(address: string, expected: Utils.BigNumber): Promise<void>;
    protected getWalletBalance(address: string): Promise<Utils.BigNumber>;
    protected broadcastTransactions(transactions: any): Promise<void>;
    protected getTransaction(id: string): Promise<any>;
    protected castFlags(values: Record<string, any>): string[];
    protected toSatoshi(value: any): string;
    protected fromSatoshi(satoshi: any): string;
    private setupConfiguration;
    private setupConfigurationForCrypto;
    private awaitConfirmations;
    private getNonce;
}
