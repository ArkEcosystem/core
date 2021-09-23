import { ITransactionData } from "../../../interfaces";
import { TransactionBuilder } from "./transaction";
export declare class SecondSignatureBuilder extends TransactionBuilder<SecondSignatureBuilder> {
    constructor();
    signatureAsset(secondPassphrase: string): SecondSignatureBuilder;
    getStruct(): ITransactionData;
    protected instance(): SecondSignatureBuilder;
}
