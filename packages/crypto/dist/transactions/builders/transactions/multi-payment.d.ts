import { ITransactionData } from "../../../interfaces";
import { TransactionBuilder } from "./transaction";
export declare class MultiPaymentBuilder extends TransactionBuilder<MultiPaymentBuilder> {
    constructor();
    addPayment(recipientId: string, amount: string): MultiPaymentBuilder;
    getStruct(): ITransactionData;
    protected instance(): MultiPaymentBuilder;
}
