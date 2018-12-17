import { TransactionTypes } from "../../constants";
import { feeManager } from "../../managers/fee";
import { TransactionBuilder } from "./transaction";

export class TransferBuilder extends TransactionBuilder {
    /**
     * @constructor
     */
    constructor() {
        super();

        this.data.type = TransactionTypes.Transfer;
        this.data.fee = feeManager.get(TransactionTypes.Transfer);
        this.data.amount = 0;
        this.data.recipientId = null;
        this.data.senderPublicKey = null;
        this.data.expiration = 0;
    }

    /**
     * Overrides the inherited method to return the additional required by this
     * @return {Object}
     */
    public getStruct() {
        const struct = super.getStruct();
        struct.amount = this.data.amount;
        struct.recipientId = this.data.recipientId;
        struct.asset = this.data.asset;
        struct.vendorField = this.data.vendorField;
        // struct.vendorFieldHex = this.vendorFieldHex // v2
        return struct;
    }
}
