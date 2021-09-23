/// <reference types="node" />
import { ISerializeOptions } from "../interfaces";
import { ITransaction, ITransactionData } from "../interfaces";
export declare class Serializer {
    static getBytes(transaction: ITransactionData, options?: ISerializeOptions): Buffer;
    /**
     * Serializes the given transaction according to AIP11.
     */
    static serialize(transaction: ITransaction, options?: ISerializeOptions): Buffer;
    /**
     * Serializes the given transaction prior to AIP11 (legacy).
     */
    private static getBytesV1;
    private static serializeCommon;
    private static serializeVendorField;
    private static serializeSignatures;
}
