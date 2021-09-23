import { IKeyPair, ISerializeOptions, ITransactionData } from "../interfaces";
export declare class Signer {
    static sign(transaction: ITransactionData, keys: IKeyPair, options?: ISerializeOptions): string;
    static secondSign(transaction: ITransactionData, keys: IKeyPair): string;
    static multiSign(transaction: ITransactionData, keys: IKeyPair, index?: number): string;
}
