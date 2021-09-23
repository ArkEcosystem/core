import { TransactionConstructor } from "..";
import { ITransaction, ITransactionData } from "../../interfaces";
import { InternalTransactionType } from "./internal-transaction-type";
export declare class TransactionTypeFactory {
    static initialize(transactionTypes: Map<InternalTransactionType, TransactionConstructor>): void;
    static create(data: ITransactionData): ITransaction;
    static get(type: number, typeGroup?: number): TransactionConstructor;
    private static transactionTypes;
}
