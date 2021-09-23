import { IHtlcRefundAsset, ITransactionData } from "../../../interfaces";
import { TransactionBuilder } from "./transaction";
export declare class HtlcRefundBuilder extends TransactionBuilder<HtlcRefundBuilder> {
    constructor();
    htlcRefundAsset(refundAsset: IHtlcRefundAsset): HtlcRefundBuilder;
    getStruct(): ITransactionData;
    protected instance(): HtlcRefundBuilder;
}
