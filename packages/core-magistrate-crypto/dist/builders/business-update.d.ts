import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { IBusinessUpdateAsset } from "../interfaces";
export declare class BusinessUpdateBuilder extends Transactions.TransactionBuilder<BusinessUpdateBuilder> {
    constructor();
    getStruct(): Interfaces.ITransactionData;
    businessUpdateAsset(businessAsset: IBusinessUpdateAsset): BusinessUpdateBuilder;
    protected instance(): BusinessUpdateBuilder;
}
