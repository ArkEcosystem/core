import { IMultiSignatureAsset, ITransactionData } from "../../../interfaces";
import { TransactionBuilder } from "./transaction";
export declare class MultiSignatureBuilder extends TransactionBuilder<MultiSignatureBuilder> {
    constructor();
    participant(publicKey: string): MultiSignatureBuilder;
    min(min: number): MultiSignatureBuilder;
    multiSignatureAsset(multiSignature: IMultiSignatureAsset): MultiSignatureBuilder;
    getStruct(): ITransactionData;
    protected instance(): MultiSignatureBuilder;
}
