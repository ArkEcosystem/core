import { IMultiSignatureAsset } from "../interfaces";
import { NetworkType } from "../types";
export declare class PublicKey {
    static fromPassphrase(passphrase: string): string;
    static fromWIF(wif: string, network?: NetworkType): string;
    static fromMultiSignatureAsset(asset: IMultiSignatureAsset): string;
    static validate(publicKey: string, networkVersion?: number): boolean;
}
