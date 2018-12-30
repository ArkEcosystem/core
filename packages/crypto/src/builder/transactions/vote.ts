import { TransactionTypes } from "../../constants";
import { feeManager } from "../../managers";
import { TransactionBuilder } from "./transaction";

export class VoteBuilder extends TransactionBuilder {
    /**
     * @constructor
     */
    constructor() {
        super();

        this.data.type = TransactionTypes.Vote;
        this.data.fee = feeManager.get(TransactionTypes.Vote);
        this.data.amount = 0;
        this.data.recipientId = null;
        this.data.senderPublicKey = null;
        this.data.asset = { votes: [] };

        this.signWithSenderAsRecipient = true;
    }

    /**
     * Establish the votes on the asset.
     * @param  {Array} votes
     * @return {VoteBuilder}
     */
    public votesAsset(votes) {
        this.data.asset.votes = votes;
        return this;
    }

    /**
     * Overrides the inherited method to return the additional required by this
     * @return {Object}
     */
    public getStruct() {
        const struct = super.getStruct();
        struct.amount = this.data.amount;
        struct.recipientId = this.data.recipientId;
        struct.asset = this.data.asset;
        return struct;
    }
}
