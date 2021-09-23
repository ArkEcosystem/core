import { State } from "@arkecosystem/core-interfaces";
import { Interfaces } from "@arkecosystem/crypto";
export declare const transformWallet: (wallet: State.IWallet) => {
    secondPublicKey: any;
    username: string;
    address: string;
    publicKey: string;
    nonce: string;
    balance: string;
    attributes: Readonly<Record<string, any>>;
    lockedBalance: any;
    isDelegate: boolean;
    isResigned: boolean;
    vote: any;
    multiSignature: Interfaces.IMultiSignatureAsset;
};
