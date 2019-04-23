import { TransactionTypes } from "../../../enums";
import { Keys } from "../../../identities";
import { ITransactionAsset, ITransactionData } from "../../../interfaces";
import { feeManager } from "../../../managers";
import { BigNumber } from "../../../utils";
import { TransactionBuilder } from "./transaction";

export class SecondSignatureBuilder extends TransactionBuilder<SecondSignatureBuilder> {
    constructor() {
        super();

        this.data.type = TransactionTypes.SecondSignature;
        this.data.fee = feeManager.get(TransactionTypes.SecondSignature);
        this.data.amount = BigNumber.ZERO;
        this.data.recipientId = null;
        this.data.senderPublicKey = null;
        this.data.asset = { signature: {} } as ITransactionAsset;
    }

    public signatureAsset(secondPassphrase: string): SecondSignatureBuilder {
        this.data.asset.signature.publicKey = Keys.fromPassphrase(secondPassphrase).publicKey;
        return this;
    }

    public getStruct(): ITransactionData {
        const struct: ITransactionData = super.getStruct();
        struct.amount = this.data.amount;
        struct.recipientId = this.data.recipientId;
        struct.asset = this.data.asset;
        return struct;
    }

    protected instance(): SecondSignatureBuilder {
        return this;
    }
}
