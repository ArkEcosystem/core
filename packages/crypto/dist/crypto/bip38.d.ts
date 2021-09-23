/// <reference types="node" />
import { IDecryptResult } from "../interfaces";
export declare const verify: (bip38: string) => boolean;
export declare const encrypt: (privateKey: Buffer, compressed: boolean, passphrase: string) => string;
export declare const decrypt: (bip38: string, passphrase: any) => IDecryptResult;
