import { TransactionTypes } from "../../constants";
import { feeManager } from "../../managers";
import { ITransactionData } from "../../models";
import { TransactionBuilder } from "./transaction";

export class MultiSignatureBuilder extends TransactionBuilder {

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
     */
    public multiSignatureAsset(multiSignature): MultiSignatureBuilder {
        this.data.asset.multisignature = multiSignature;
        this.data.fee = (multiSignature.keysgroup.length + 1) * feeManager.get(TransactionTypes.MultiSignature);

        return this;
    }

    public getStruct(): ITransactionData {
        const struct = super.getStruct();
        struct.amount = this.data.amount;
        struct.recipientId = this.data.recipientId;
        struct.asset = this.data.asset;

        return struct;
    }
}
