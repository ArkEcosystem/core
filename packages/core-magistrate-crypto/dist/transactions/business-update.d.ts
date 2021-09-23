import { Transactions, Utils } from "@arkecosystem/crypto";
import ByteBuffer from "bytebuffer";
export declare class BusinessUpdateTransaction extends Transactions.Transaction {
    static typeGroup: number;
    static type: number;
    static key: string;
    static getSchema(): Transactions.schemas.TransactionSchema;
    protected static defaultStaticFee: Utils.BigNumber;
    serialize(): ByteBuffer;
    deserialize(buf: ByteBuffer): void;
}
