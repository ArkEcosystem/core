import { NetworkType } from "../types";
export declare class PrivateKey {
    static fromPassphrase(passphrase: string): string;
    static fromWIF(wif: string, network?: NetworkType): string;
}
