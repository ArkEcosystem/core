import { Interfaces, Types } from "@arkecosystem/crypto";
export declare class Delegate {
    static encryptPassphrase(passphrase: string, network: Types.NetworkType, password: string): string;
    static decryptPassphrase(passphrase: string, network: Types.NetworkType, password: string): Interfaces.IKeyPair;
    network: Types.NetworkType;
    keySize: number;
    iterations: number;
    keys: Interfaces.IKeyPair;
    publicKey: string;
    address: string;
    otpSecret: string;
    bip38: boolean;
    otp: string;
    encryptedKeys: string;
    constructor(passphrase: string, network: Types.NetworkType, password?: string);
    encryptKeysWithOtp(): void;
    decryptKeysWithOtp(): void;
    forge(transactions: Interfaces.ITransactionData[], options: Record<string, any>): Interfaces.IBlock | undefined;
    private encryptDataWithOtp;
    private decryptDataWithOtp;
}
