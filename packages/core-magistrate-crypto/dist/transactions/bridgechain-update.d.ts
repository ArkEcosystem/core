import { Transactions, Utils } from "@arkecosystem/crypto";
import ByteBuffer from "bytebuffer";
import { MagistrateTransactionType } from "../enums";
export declare class BridgechainUpdateTransaction extends Transactions.Transaction {
    static typeGroup: number;
    static type: MagistrateTransactionType;
    static key: string;
    static getSchema(): Transactions.schemas.TransactionSchema;
    protected static defaultStaticFee: Utils.BigNumber;
    serialize(): ByteBuffer;
    deserialize(buf: ByteBuffer): void;
}
