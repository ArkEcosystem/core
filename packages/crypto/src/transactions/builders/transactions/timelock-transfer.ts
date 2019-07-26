import { TransactionTypes } from "../../../enums";
import { ITransactionData } from "../../../interfaces";
import { BigNumber } from "../../../utils";
import { TimelockTransferTransaction } from '../../types';
import { TransactionBuilder } from "./transaction";

export class TimelockTransferBuilder extends TransactionBuilder<TimelockTransferBuilder> {
    constructor() {
        super();

        this.data.type = TransactionTypes.TimelockTransfer;
        this.data.fee = TimelockTransferTransaction.staticFee();
        this.data.amount = BigNumber.ZERO;
        this.data.recipientId = undefined;
        this.data.senderPublicKey = undefined;
        this.data.timelockType = 0x00;
        this.data.timelock = undefined;
        this.data.asset = {};
    }

    public timelock(timelock: number, timelockType: number): TimelockTransferBuilder {
        this.data.timelock = timelock;
        this.data.timelockType = timelockType;
        return this;
    }

    public getStruct(): ITransactionData {
        const struct: ITransactionData = super.getStruct();
        struct.amount = this.data.amount;
        struct.recipientId = this.data.recipientId;
        struct.vendorFieldHex = this.data.vendorFieldHex;
        struct.vendorField = this.data.vendorField;
        struct.asset = this.data.asset;
        struct.timelock = this.data.timelock;
        struct.timelockType = this.data.timelockType;
        return struct;
    }

    protected instance(): TimelockTransferBuilder {
        return this;
    }
}
