/// <reference types="node" />
import { IKeyPair } from "../interfaces";
export declare class Hash {
    static signECDSA(hash: Buffer, keys: IKeyPair): string;
    static verifyECDSA(hash: Buffer, signature: Buffer | string, publicKey: Buffer | string): boolean;
    static signSchnorr(hash: Buffer, keys: IKeyPair): string;
    static verifySchnorr(hash: Buffer, signature: Buffer | string, publicKey: Buffer | string): boolean;
}
