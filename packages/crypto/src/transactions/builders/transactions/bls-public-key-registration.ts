import { ITransactionData } from "../../../interfaces";
import { BigNumber } from "../../../utils";
import { Two } from "../../types";
import { TransactionBuilder } from "./transaction";

export class BlsPublicKeyRegistrationBuilder extends TransactionBuilder<BlsPublicKeyRegistrationBuilder> {
    public constructor() {
        super();

        this.data.type = Two.BlsPublicKeyRegistrationTransaction.type;
        this.data.typeGroup = Two.VoteTransaction.typeGroup;
        this.data.fee = Two.BlsPublicKeyRegistrationTransaction.staticFee();
        this.data.amount = BigNumber.ZERO;
        this.data.recipientId = undefined;
        this.data.senderPublicKey = undefined;
        this.data.asset = {};

        this.signWithSenderAsRecipient = true;
    }

    public blsPublicKeyAsset(blsPublicKey: string): BlsPublicKeyRegistrationBuilder {
        this.data.asset = {
            blsPublicKey,
        };

        return this;
    }

    public getStruct(): ITransactionData {
        const struct: ITransactionData = super.getStruct();
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
    }

    protected instance(): BlsPublicKeyRegistrationBuilder {
        return this;
    }
}
