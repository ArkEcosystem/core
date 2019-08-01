import { TransactionTypes } from "../../../enums";
import { IHtlcLockAsset, ITransactionData } from "../../../interfaces";
import { BigNumber } from "../../../utils";
import { HtlcLockTransaction } from "../../types";
import { TransactionBuilder } from "./transaction";

export class HtlcLockBuilder extends TransactionBuilder<HtlcLockBuilder> {
    constructor() {
        super();

        this.data.type = TransactionTypes.HtlcLock;
        this.data.recipientId = undefined;
        this.data.amount = BigNumber.ZERO;
        this.data.fee = HtlcLockTransaction.staticFee();
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
        struct.asset = this.data.asset;
        return struct;
    }

    protected instance(): HtlcLockBuilder {
        return this;
    }
}
