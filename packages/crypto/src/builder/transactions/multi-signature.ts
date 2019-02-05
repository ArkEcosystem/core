import { TransactionTypes } from "../../constants";
import { feeManager } from "../../managers";
import { IMultiSignatureAsset, ITransactionAsset, ITransactionData } from "../../transactions";
import { TransactionBuilder } from "./transaction";

export class MultiSignatureBuilder extends TransactionBuilder<MultiSignatureBuilder> {
    constructor() {
        super();

        this.data.type = TransactionTypes.MultiSignature;
        this.data.fee = 0;
        this.data.amount = 0;
        this.data.recipientId = null;
        this.data.senderPublicKey = null;
        this.data.asset = { multisignature: {} } as ITransactionAsset;

        this.signWithSenderAsRecipient = true;
    }

    /**
     * Establish the multi-signature on the asset and updates the fee.
     */
    public multiSignatureAsset(multiSignature: IMultiSignatureAsset): MultiSignatureBuilder {
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

    protected instance(): MultiSignatureBuilder {
        return this;
    }
}
