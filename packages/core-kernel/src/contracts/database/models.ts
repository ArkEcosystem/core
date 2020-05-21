import { Types } from "@arkecosystem/crypto";

export interface BlockModel {
    id: string;
    version: number;
    timestamp: number;
    previousBlock: string;
    height: number;
    numberOfTransactions: number;
    totalAmount: Types.BigNumber;
    totalFee: Types.BigNumber;
    reward: Types.BigNumber;
    payloadLength: number;
    payloadHash: string;
    generatorPublicKey: string;
    blockSignature: string;
}

export interface TransactionModel {
    id: string;
    version: number;
    blockId: string;
    sequence: number;
    timestamp: number;
    nonce: Types.BigNumber;
    senderPublicKey: string;
    recipientId: string;
    type: number;
    typeGroup: number;
    vendorField: string | undefined;
    amount: Types.BigNumber;
    fee: Types.BigNumber;
    serialized: Buffer;
    asset: Record<string, any>;
}
