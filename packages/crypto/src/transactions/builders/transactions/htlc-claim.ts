import { TransactionTypes } from "../../../enums";
import { IHtlcClaimAsset, ITransactionData } from "../../../interfaces";
import { feeManager } from "../../../managers";
import { BigNumber } from "../../../utils";
import { TransactionBuilder } from "./transaction";

export class HtlcClaimBuilder extends TransactionBuilder<HtlcClaimBuilder> {
    constructor() {
        super();

        this.data.type = TransactionTypes.HtlcClaim;
        this.data.fee = feeManager.get(TransactionTypes.HtlcClaim);
        this.data.amount = BigNumber.ZERO;
        this.data.asset = {};
    }

    public htlcClaimAsset(claimAsset: IHtlcClaimAsset): HtlcClaimBuilder {
        this.data.asset = {
            claim: claimAsset,
        };

        return this;
    }

    public getStruct(): ITransactionData {
        const struct: ITransactionData = super.getStruct();
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
    }

    protected instance(): HtlcClaimBuilder {
        return this;
    }
}
