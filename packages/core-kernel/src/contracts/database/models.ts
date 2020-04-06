import { Utils } from "@arkecosystem/crypto";

export interface Block {
    id: string;
    version: number;
    timestamp: number;
    previousBlock: string;
    height: number;
    numberOfTransactions: number;
    totalAmount: Utils.BigNumber;
    totalFee: Utils.BigNumber;
    reward: Utils.BigNumber;
    payloadLength: number;
    payloadHash: string;
    generatorPublicKey: string;
    blockSignature: string;
}

export interface Transaction {
    id: string;
    version: number;
    blockId: string;
    sequence: number;
    timestamp: number;
    nonce: Utils.BigNumber;
    senderPublicKey: string;
    recipientId: string;
    type: number;
    typeGroup: number;
    vendorField: string | undefined;
    amount: BigInt;
    fee: BigInt;
    serialized: Buffer;
    asset: Record<string, any>;
}

export interface Round {
    publicKey: string;
    round: Utils.BigNumber;
    balance: Utils.BigNumber;
}
