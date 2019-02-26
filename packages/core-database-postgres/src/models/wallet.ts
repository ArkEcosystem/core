import { Database } from "@arkecosystem/core-interfaces";
import { bignumify } from "@arkecosystem/core-utils";
import { Model } from "./model";

export class Wallet extends Model {
    constructor(pgp) {
        super(pgp);

        this.columnsDescriptor = [
            {
                name: "address",
                supportedOperators: [Database.SearchOperator.OP_EQ, Database.SearchOperator.OP_IN],
            },
            {
                name: "public_key",
                prop: "publicKey",
                supportedOperators: [Database.SearchOperator.OP_EQ, Database.SearchOperator.OP_IN],
            },
            {
                name: "second_public_key",
                prop: "secondPublicKey",
                supportedOperators: [Database.SearchOperator.OP_EQ, Database.SearchOperator.OP_IN],
            },
            {
                name: "vote",
                supportedOperators: [Database.SearchOperator.OP_EQ],
            },
            {
                name: "username",
                supportedOperators: [Database.SearchOperator.OP_EQ, Database.SearchOperator.OP_LIKE],
            },
            {
                name: "balance",
                init: col => bignumify(col.value).toFixed(),
                supportedOperators: [
                    Database.SearchOperator.OP_EQ,
                    Database.SearchOperator.OP_GTE,
                    Database.SearchOperator.OP_LTE,
                ],
            },
            {
                name: "vote_balance",
                prop: "voteBalance",
                init: col => (col.value ? bignumify(col.value).toFixed() : null),
                supportedOperators: [
                    Database.SearchOperator.OP_EQ,
                    Database.SearchOperator.OP_GTE,
                    Database.SearchOperator.OP_LTE,
                ],
            },
            {
                name: "produced_blocks",
                prop: "producedBlocks",
                supportedOperators: [
                    Database.SearchOperator.OP_EQ,
                    Database.SearchOperator.OP_GTE,
                    Database.SearchOperator.OP_LTE,
                ],
            },
            {
                name: "missed_blocks",
                prop: "missedBlocks",
                supportedOperators: [
                    Database.SearchOperator.OP_EQ,
                    Database.SearchOperator.OP_GTE,
                    Database.SearchOperator.OP_LTE,
                ],
            },
        ];
    }

    /**
     * The table associated with the model.
     * @return {String}
     */
    public getTable() {
        return "wallets";
    }
}
