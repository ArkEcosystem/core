/// <reference types="node" />
/// <reference types="bytebuffer" />
import { ISchemaValidationResult, ITransaction, ITransactionData, ITransactionJson } from "../../interfaces";
import { BigNumber } from "../../utils/bignum";
import { TransactionSchema } from "./schemas";
export declare abstract class Transaction implements ITransaction {
    get id(): string;
    get type(): number;
    get typeGroup(): number;
    get verified(): boolean;
    get key(): string;
    get staticFee(): BigNumber;
    static type: number;
    static typeGroup: number;
    static key: string;
    static getSchema(): TransactionSchema;
    static staticFee(feeContext?: {
        height?: number;
        data?: ITransactionData;
    }): BigNumber;
    protected static defaultStaticFee: BigNumber;
    isVerified: boolean;
    data: ITransactionData;
    serialized: Buffer;
    timestamp: number;
    abstract serialize(): ByteBuffer;
    abstract deserialize(buf: ByteBuffer): void;
    verify(): boolean;
    verifySecondSignature(publicKey: string): boolean;
    verifySchema(): ISchemaValidationResult;
    toJson(): ITransactionJson;
    hasVendorField(): boolean;
}
