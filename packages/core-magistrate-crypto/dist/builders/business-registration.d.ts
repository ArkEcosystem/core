import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { IBusinessRegistrationAsset } from "../interfaces";
export declare class BusinessRegistrationBuilder extends Transactions.TransactionBuilder<BusinessRegistrationBuilder> {
    constructor();
    businessRegistrationAsset(businessAsset: IBusinessRegistrationAsset): BusinessRegistrationBuilder;
    getStruct(): Interfaces.ITransactionData;
    protected instance(): BusinessRegistrationBuilder;
}
