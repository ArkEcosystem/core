import { IHtlcClaimAsset, ITransactionData } from "../../../interfaces";
import { BigNumber } from "../../../utils";
import { Two } from "../../types";
import { TransactionBuilder } from "./transaction";

export class HtlcClaimBuilder extends TransactionBuilder<HtlcClaimBuilder> {
    public constructor() {
        super();

        this.data.type = Two.HtlcClaimTransaction.type;
        this.data.typeGroup = Two.HtlcClaimTransaction.typeGroup;
        this.data.fee = Two.HtlcClaimTransaction.staticFee();
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
