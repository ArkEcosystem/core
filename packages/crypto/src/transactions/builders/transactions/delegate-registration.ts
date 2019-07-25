import { TransactionTypes } from "../../../enums";
import { ITransactionAsset, ITransactionData } from "../../../interfaces";
import { BigNumber } from "../../../utils";
import { DelegateRegistrationTransaction } from '../../types';
import { TransactionBuilder } from "./transaction";

export class DelegateRegistrationBuilder extends TransactionBuilder<DelegateRegistrationBuilder> {
    constructor() {
        super();

        this.data.type = TransactionTypes.DelegateRegistration;
        this.data.fee = DelegateRegistrationTransaction.staticFee();
        this.data.amount = BigNumber.ZERO;
        this.data.recipientId = undefined;
        this.data.senderPublicKey = undefined;
        this.data.asset = { delegate: {} } as ITransactionAsset;
    }

    public usernameAsset(username: string): DelegateRegistrationBuilder {
        this.data.asset.delegate.username = username;
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
