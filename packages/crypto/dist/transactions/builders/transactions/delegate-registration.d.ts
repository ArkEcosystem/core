import { ITransactionData } from "../../../interfaces";
import { TransactionBuilder } from "./transaction";
export declare class DelegateRegistrationBuilder extends TransactionBuilder<DelegateRegistrationBuilder> {
    constructor();
    usernameAsset(username: string): DelegateRegistrationBuilder;
    getStruct(): ITransactionData;
    protected instance(): DelegateRegistrationBuilder;
}
