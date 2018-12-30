import { TransactionTypes } from "../../constants";
import { feeManager } from "../../managers";
import { TransactionBuilder } from "./transaction";

export class MultiSignatureBuilder extends TransactionBuilder {
    /**
     * @constructor
     */
    constructor() {
        super();

        this.data.type = TransactionTypes.MultiSignature;
        this.data.fee = 0;
        this.data.amount = 0;
        this.data.recipientId = null;
        this.data.senderPublicKey = null;
        this.data.asset = { multisignature: {} };

        this.signWithSenderAsRecipient = true;
    }

    /**
     * Establish the multi-signature on the asset and updates the fee.
     * @param  {Object} multiSignature { keysgroup, lifetime, min }
     * @return {MultiSignatureBuilder}
     */
    public multiSignatureAsset(multiSignature) {
        this.data.asset.multisignature = multiSignature;
        this.data.fee = (multiSignature.keysgroup.length + 1) * feeManager.get(TransactionTypes.MultiSignature);

        return this;
    }

    /**
     * Overrides the inherited method to return the additional required by this.
     * @return {Object}
     */
    public getStruct() {
        const struct = super.getStruct();
        struct.amount = this.data.amount;
        struct.recipientId = this.data.recipientId;
        struct.asset = this.data.asset;

        return struct;
    }
}
