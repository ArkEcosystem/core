import { bignumify } from "@arkecosystem/core-utils";
import { Model } from "./model";

export class Wallet extends Model {
    /**
     * The table associated with the model.
     * @return {String}
     */
    public getTable() {
        return "wallets";
    }

    /**
     * The read-only structure with query-formatting columns.
     * @return {Object}
     */
    public getColumnSet() {
        return this.createColumnSet([
            {
                name: "address",
            },
            {
                name: "public_key",
                prop: "publicKey",
            },
            {
                name: "second_public_key",
                prop: "secondPublicKey",
            },
            {
                name: "vote",
            },
            {
                name: "username",
            },
            {
                name: "balance",
                init: col => bignumify(col.value).toFixed(),
            },
            {
                name: "vote_balance",
                prop: "voteBalance",
                init: col => (col.value ? bignumify(col.value).toFixed() : null),
            },
            {
                name: "produced_blocks",
                prop: "producedBlocks",
            },
            {
                name: "missed_blocks",
                prop: "missedBlocks",
            },
        ]);
    }
}
