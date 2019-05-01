import { TransactionTypes } from "../../../enums";
import { IMultiSignatureAsset, ITransactionAsset, ITransactionData } from "../../../interfaces";
import { feeManager } from "../../../managers";
import { BigNumber } from "../../../utils";
import { TransactionBuilder } from "./transaction";

export class MultiSignatureBuilder extends TransactionBuilder<MultiSignatureBuilder> {
    constructor() {
        super();

        this.data.type = TransactionTypes.MultiSignature;
        this.data.fee = BigNumber.ZERO;
        this.data.amount = BigNumber.ZERO;
        this.data.recipientId = undefined;
        this.data.senderPublicKey = undefined;
        this.data.asset = { multisignature: {} } as ITransactionAsset;

        this.signWithSenderAsRecipient = true;
    }

    public multiSignatureAsset(multiSignature: IMultiSignatureAsset): MultiSignatureBuilder {
        this.data.asset.multisignature = multiSignature;
        this.data.fee = BigNumber.make(multiSignature.keysgroup.length + 1).times(
            feeManager.get(TransactionTypes.MultiSignature),
        );

        return this;
    }

    public getStruct(): ITransactionData {
        const struct: ITransactionData = super.getStruct();
        struct.amount = this.data.amount;
        struct.recipientId = this.data.recipientId;
        struct.asset = this.data.asset;

        return struct;
    }

    protected instance(): MultiSignatureBuilder {
        return this;
    }
}
