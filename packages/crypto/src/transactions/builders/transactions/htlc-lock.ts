import { IHtlcLockAsset, ITransactionData } from "../../../interfaces";
import { BigNumber } from "../../../utils";
import { Two } from "../../types";
import { TransactionBuilder } from "./transaction";

export class HtlcLockBuilder extends TransactionBuilder<HtlcLockBuilder> {
    public constructor() {
        super();

        this.data.type = Two.HtlcLockTransaction.type;
        this.data.typeGroup = Two.HtlcLockTransaction.typeGroup;
        this.data.recipientId = undefined;
        this.data.amount = BigNumber.ZERO;
        this.data.fee = Two.HtlcLockTransaction.staticFee();
        this.data.vendorField = undefined;
        this.data.asset = {};
    }

    public htlcLockAsset(lockAsset: IHtlcLockAsset): HtlcLockBuilder {
        this.data.asset = {
            lock: lockAsset,
        };

        return this;
    }

    public getStruct(): ITransactionData {
        const struct: ITransactionData = super.getStruct();
        struct.recipientId = this.data.recipientId;
        struct.amount = this.data.amount;
        struct.vendorField = this.data.vendorField;
        struct.asset = JSON.parse(JSON.stringify(this.data.asset));
        return struct;
    }

    public expiration(expiration: number): HtlcLockBuilder {
        return this;
    }

    protected instance(): HtlcLockBuilder {
        return this;
    }
}
