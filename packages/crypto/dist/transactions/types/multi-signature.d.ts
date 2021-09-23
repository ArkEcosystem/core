import ByteBuffer from "bytebuffer";
import { ISerializeOptions, ITransactionData } from "../../interfaces";
import { BigNumber } from "../../utils/bignum";
import * as schemas from "./schemas";
import { Transaction } from "./transaction";
export declare class MultiSignatureRegistrationTransaction extends Transaction {
    static typeGroup: number;
    static type: number;
    static key: string;
    static getSchema(): schemas.TransactionSchema;
    static staticFee(feeContext?: {
        height?: number;
        data?: ITransactionData;
    }): BigNumber;
    protected static defaultStaticFee: BigNumber;
    verify(): boolean;
    serialize(options?: ISerializeOptions): ByteBuffer;
    deserialize(buf: ByteBuffer): void;
}
