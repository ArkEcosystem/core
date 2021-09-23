/// <reference types="node" />
import { IKeyPair } from "../interfaces";
import { INetwork } from "../interfaces/networks";
export declare class Keys {
    static fromPassphrase(passphrase: string, compressed?: boolean): IKeyPair;
    static fromPrivateKey(privateKey: Buffer | string, compressed?: boolean): IKeyPair;
    static fromWIF(wifKey: string, network?: INetwork): IKeyPair;
}
