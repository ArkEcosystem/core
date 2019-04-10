import { TransactionTypes } from "../../../enums";
import { IMultiSignatureAsset, ITransactionAsset, ITransactionData } from "../../../interfaces";
import { feeManager } from "../../../managers";
import { Bignum } from "../../../utils";
import { TransactionBuilder } from "./transaction";

export class MultiSignatureBuilder extends TransactionBuilder<MultiSignatureBuilder> {
    constructor() {
        super();

        this.data.type = TransactionTypes.MultiSignature;
        this.data.fee = Bignum.ZERO;
        this.data.amount = Bignum.ZERO;
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
        this.data.fee = new Bignum(multiSignature.keysgroup.length + 1).times(
            feeManager.get(TransactionTypes.MultiSignature),
        );

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
