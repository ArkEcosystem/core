/// <reference types="node" />
import { ISerializeOptions, ITransactionData } from "../interfaces";
export declare class Utils {
    static toBytes(data: ITransactionData): Buffer;
    static toHash(transaction: ITransactionData, options?: ISerializeOptions): Buffer;
    static getId(transaction: ITransactionData, options?: ISerializeOptions): string;
}
