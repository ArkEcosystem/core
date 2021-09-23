import { Interfaces } from "@arkecosystem/crypto";
export declare const transformTransaction: (model: any, transform: any) => Interfaces.ITransactionJson | {
    id: string;
    blockId: any;
    version: number;
    type: number;
    typeGroup: number;
    amount: string;
    fee: string;
    sender: string;
    senderPublicKey: string;
    recipient: string;
    signature: string;
    signSignature: string;
    signatures: string[];
    vendorField: string;
    asset: Interfaces.ITransactionAsset;
    confirmations: number;
    timestamp: {
        epoch: number;
        unix: number;
        human: string;
    };
    nonce: string;
};
