import { Keys } from "../../../identities";
import { ITransactionAsset, ITransactionData } from "../../../interfaces";
import { BigNumber } from "../../../utils";
import { SecondSignatureRegistrationTransaction } from "../../types";
import { TransactionBuilder } from "./transaction";

export class SecondSignatureBuilder extends TransactionBuilder<SecondSignatureBuilder> {
    constructor() {
        super();

        this.data.type = SecondSignatureRegistrationTransaction.type;
        this.data.typeGroup = SecondSignatureRegistrationTransaction.typeGroup;
        this.data.fee = SecondSignatureRegistrationTransaction.staticFee();
        this.data.amount = BigNumber.ZERO;
        this.data.recipientId = undefined;
        this.data.senderPublicKey = undefined;
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
