import { IKeyPair } from "../interfaces";
import { INetwork } from "../interfaces/networks";
export declare class WIF {
    static fromPassphrase(passphrase: string, network?: INetwork): string;
    static fromKeys(keys: IKeyPair, network?: INetwork): string;
}
