import { IHtlcClaimAsset, ITransactionData } from "../../../interfaces";
import { TransactionBuilder } from "./transaction";
export declare class HtlcClaimBuilder extends TransactionBuilder<HtlcClaimBuilder> {
    constructor();
    htlcClaimAsset(claimAsset: IHtlcClaimAsset): HtlcClaimBuilder;
    getStruct(): ITransactionData;
    protected instance(): HtlcClaimBuilder;
}
