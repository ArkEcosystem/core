import { TransactionTypes } from "../../../enums";
import { ITransactionData } from "../../../interfaces";
import { feeManager } from "../../../managers";
import { BigNumber } from "../../../utils";
import { TransactionBuilder } from "./transaction";

export class VoteBuilder extends TransactionBuilder<VoteBuilder> {
    constructor() {
        super();

        this.data.type = TransactionTypes.Vote;
        this.data.fee = feeManager.get(TransactionTypes.Vote);
        this.data.amount = BigNumber.ZERO;
        this.data.recipientId = null;
        this.data.senderPublicKey = null;
        this.data.asset = { votes: [] };

        this.signWithSenderAsRecipient = true;
    }

    public votesAsset(votes: string[]): VoteBuilder {
        this.data.asset.votes = votes;
        return this;
    }

    public getStruct(): ITransactionData {
        const struct: ITransactionData = super.getStruct();
        struct.amount = this.data.amount;
        struct.recipientId = this.data.recipientId;
        struct.asset = this.data.asset;
        return struct;
    }

    protected instance(): VoteBuilder {
        return this;
    }
}
