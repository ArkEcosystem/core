import { TransactionTypes } from "../../constants";
import { feeManager } from "../../managers/fee";
import { TransactionBuilder } from "./transaction";

export class TimelockTransferBuilder extends TransactionBuilder {
    /**
     * @constructor
     */
    constructor() {
        super();

        this.data.type = TransactionTypes.TimelockTransfer;
        this.data.fee = feeManager.get(TransactionTypes.TimelockTransfer);
        this.data.amount = 0;
        this.data.recipientId = null;
        this.data.senderPublicKey = null;
        this.data.timelockType = 0x00;
        this.data.timelock = null;
    }

    /**
     * Set the timelock and the timelock type
     * @param  {Number} timelock
     * @param  {Number} timelockType
     * @return {TimelockTransferBuilder}
     */
    public timelock(timelock, timelockType) {
        this.data.timelock = timelock;
        this.data.timelockType = timelockType;
        return this;
    }

    /**
     * Overrides the inherited method to return the additional required by this
     * @return {Object}
     */
    public getStruct() {
        const struct = super.getStruct();
        struct.amount = this.data.amount;
        struct.recipientId = this.data.recipientId;
        struct.vendorFieldHex = this.data.vendorFieldHex;
        struct.asset = this.data.asset;
        struct.timelock = this.data.timelock;
        struct.timelockType = this.data.timelockType;
        return struct;
    }
}
