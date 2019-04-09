import { TransactionTypes } from "../../../enums";
import { ITransactionData } from "../../../interfaces";
import { feeManager } from "../../../managers";
import { TransactionBuilder } from "./transaction";

export class TimelockTransferBuilder extends TransactionBuilder<TimelockTransferBuilder> {
    constructor() {
        super();

        this.data.type = TransactionTypes.TimelockTransfer;
        this.data.fee = feeManager.get(TransactionTypes.TimelockTransfer);
        this.data.amount = 0;
        this.data.recipientId = null;
        this.data.senderPublicKey = null;
        this.data.timelockType = 0x00;
        this.data.timelock = null;
        this.data.asset = {};
    }

    /**
     * Set the timelock and the timelock type
     */
    public timelock(timelock: number, timelockType: number): TimelockTransferBuilder {
        this.data.timelock = timelock;
        this.data.timelockType = timelockType;
        return this;
    }

    public getStruct(): ITransactionData {
        const struct = super.getStruct();
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
