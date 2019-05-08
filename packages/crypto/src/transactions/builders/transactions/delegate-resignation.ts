import { TransactionTypes } from "../../../enums";
import { ITransactionAsset, ITransactionData } from "../../../interfaces";
import { feeManager } from "../../../managers";
import { BigNumber } from "../../../utils";
import { TransactionBuilder } from "./transaction";

export class DelegateResignationBuilder extends TransactionBuilder<DelegateResignationBuilder> {
    constructor() {
        super();

        this.data.type = TransactionTypes.DelegateResignation;
        this.data.fee = feeManager.get(TransactionTypes.DelegateResignation);
        this.data.amount = BigNumber.ZERO;
        this.data.recipientId = undefined;
        this.data.senderPublicKey = undefined;
        this.data.asset = { delegate: {} } as ITransactionAsset;
    }

    public usernameAsset(username: string): DelegateResignationBuilder {
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

    protected instance(): DelegateResignationBuilder {
        return this;
    }
}
