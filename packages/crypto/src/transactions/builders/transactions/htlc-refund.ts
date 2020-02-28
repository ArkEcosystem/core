import { IHtlcRefundAsset, ITransactionData } from "../../../interfaces";
import { BigNumber } from "../../../utils";
import { Two } from "../../types";
import { TransactionBuilder } from "./transaction";

export class HtlcRefundBuilder extends TransactionBuilder<HtlcRefundBuilder> {
    public constructor() {
        super();

        this.data.type = Two.HtlcRefundTransaction.type;
        this.data.typeGroup = Two.HtlcRefundTransaction.typeGroup;
        this.data.fee = Two.HtlcRefundTransaction.staticFee();
        this.data.amount = BigNumber.ZERO;
        this.data.asset = {};
    }

    public htlcRefundAsset(refundAsset: IHtlcRefundAsset): HtlcRefundBuilder {
        this.data.asset = {
            refund: refundAsset,
        };

        return this;
    }

    public getStruct(): ITransactionData {
        const struct: ITransactionData = super.getStruct();
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
    }

    protected instance(): HtlcRefundBuilder {
        return this;
    }
}
