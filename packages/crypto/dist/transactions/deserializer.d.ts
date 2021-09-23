/// <reference types="node" />
import { IDeserializeOptions, ITransaction, ITransactionData } from "../interfaces";
export declare class Deserializer {
    static deserialize(serialized: string | Buffer, options?: IDeserializeOptions): ITransaction;
    private static deserializeCommon;
    private static deserializeVendorField;
    private static deserializeSignatures;
    private static deserializeSchnorrOrECDSA;
    private static deserializeECDSA;
    private static deserializeSchnorr;
    private static detectSchnorr;
    static applyV1Compatibility(transaction: ITransactionData): void;
    private static getByteBuffer;
}
