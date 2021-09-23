/// <reference types="node" />
import { ITransaction, ITransactionData, ITransactionJson } from "../interfaces";
export declare class TransactionFactory {
    static fromHex(hex: string): ITransaction;
    static fromBytes(buffer: Buffer, strict?: boolean): ITransaction;
    /**
     * Deserializes a transaction from `buffer` with the given `id`. It is faster
     * than `fromBytes` at the cost of vital safety checks (validation, verification and id calculation).
     *
     * NOTE: Only use this internally when it is safe to assume the buffer has already been
     * verified.
     */
    static fromBytesUnsafe(buffer: Buffer, id?: string): ITransaction;
    static fromJson(json: ITransactionJson): ITransaction;
    static fromData(data: ITransactionData, strict?: boolean): ITransaction;
    private static fromSerialized;
}
