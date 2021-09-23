import { ITransactionData } from "../../../interfaces";
import { TransactionBuilder } from "./transaction";
export declare class DelegateResignationBuilder extends TransactionBuilder<DelegateResignationBuilder> {
    constructor();
    getStruct(): ITransactionData;
    protected instance(): DelegateResignationBuilder;
}
