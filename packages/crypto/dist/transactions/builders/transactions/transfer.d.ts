import { ITransactionData } from "../../../interfaces";
import { TransactionBuilder } from "./transaction";
export declare class TransferBuilder extends TransactionBuilder<TransferBuilder> {
    constructor();
    expiration(expiration: number): TransferBuilder;
    getStruct(): ITransactionData;
    protected instance(): TransferBuilder;
}
