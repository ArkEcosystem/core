import { ITransactionAsset, ITransactionData } from "../../../interfaces";
import { BigNumber } from "../../../utils";
import { Two } from "../../types";
import { TransactionBuilder } from "./transaction";

export class DelegateRegistrationBuilder extends TransactionBuilder<DelegateRegistrationBuilder> {
    public constructor() {
        super();

        this.data.type = Two.DelegateRegistrationTransaction.type;
        this.data.typeGroup = Two.DelegateRegistrationTransaction.typeGroup;
        this.data.fee = Two.DelegateRegistrationTransaction.staticFee();
        this.data.amount = BigNumber.ZERO;
        this.data.recipientId = undefined;
        this.data.senderPublicKey = undefined;
        this.data.asset = { delegate: {} } as ITransactionAsset;
    }

    public usernameAsset(username: string): DelegateRegistrationBuilder {
        if (this.data.asset && this.data.asset.delegate) {
            this.data.asset.delegate.username = username;
        }

        return this;
    }

    public getStruct(): ITransactionData {
        const struct: ITransactionData = super.getStruct();
        struct.amount = this.data.amount;
        struct.recipientId = this.data.recipientId;
        struct.asset = this.data.asset;
        return struct;
    }

    protected instance(): DelegateRegistrationBuilder {
        return this;
    }
}
