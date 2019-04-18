import { TransactionTypes } from "../../../enums";
import { IMultiSignatureAsset, ITransactionData } from "../../../interfaces";
import { feeManager } from "../../../managers";
import { BigNumber } from "../../../utils";
import { TransactionBuilder } from "./transaction";

export class MultiSignatureBuilder extends TransactionBuilder<MultiSignatureBuilder> {
    constructor() {
        super();

        this.data.type = TransactionTypes.MultiSignature;
        this.data.version = 2;
        this.data.fee = BigNumber.ZERO;
        this.data.amount = BigNumber.ZERO;
        this.data.recipientId = null;
        this.data.senderPublicKey = null;
        this.data.asset = { multiSignature: { min: 0, publicKeys: [] } };
    }

    public participant(publicKey: string): MultiSignatureBuilder {
        const { publicKeys } = this.data.asset.multiSignature;

        if (publicKeys.length <= 16) {
            publicKeys.push(publicKey);
            this.data.fee = feeManager.getForTransaction(this.data);
        }

        return this;
    }

    public min(min: number): MultiSignatureBuilder {
        this.data.asset.multiSignature.min = min;

        return this;
    }

    public multiSignatureAsset(multiSignature: IMultiSignatureAsset): MultiSignatureBuilder {
        this.data.asset.multiSignature = multiSignature;
        this.data.fee = feeManager.getForTransaction(this.data);

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
