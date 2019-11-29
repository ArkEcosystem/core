import { ITransactionData } from "../../../interfaces";
import { BigNumber } from "../../../utils";
import { VoteTransaction } from "../../types";
import { TransactionBuilder } from "./transaction";

export class VoteBuilder extends TransactionBuilder<VoteBuilder> {
    constructor() {
        super();

        this.data.type = VoteTransaction.type;
        this.data.typeGroup = VoteTransaction.typeGroup;
        this.data.fee = VoteTransaction.staticFee();
        this.data.amount = BigNumber.ZERO;
        this.data.recipientId = undefined;
        this.data.senderPublicKey = undefined;
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
