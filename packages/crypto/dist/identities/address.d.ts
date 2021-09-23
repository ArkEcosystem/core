/// <reference types="node" />
import { IMultiSignatureAsset } from "../interfaces";
import { NetworkType } from "../types";
export declare class Address {
    static fromPassphrase(passphrase: string, networkVersion?: number): string;
    static fromPublicKey(publicKey: string, networkVersion?: number): string;
    static fromWIF(wif: string, network?: NetworkType): string;
    static fromMultiSignatureAsset(asset: IMultiSignatureAsset, networkVersion?: number): string;
    static fromPrivateKey(privateKey: any, networkVersion?: number): string;
    static fromBuffer(buffer: Buffer): string;
    static toBuffer(address: string): {
        addressBuffer: Buffer;
        addressError?: string;
    };
    static validate(address: string, networkVersion?: number): boolean;
}
