import { bignumify } from "@arkecosystem/core-utils";
import { Model } from "./model";

export class Block extends Model {
    /**
     * The table associated with the model.
     * @return {String}
     */
    public getTable() {
        return "blocks";
    }

    /**
     * The read-only structure with query-formatting columns.
     * @return {Object}
     */
    public getColumnSet() {
        return this.createColumnSet([
            {
                name: "id",
            },
            {
                name: "version",
            },
            {
                name: "timestamp",
            },
            {
                name: "previous_block",
                prop: "previousBlock",
                def: null,
            },
            {
                name: "height",
            },
            {
                name: "number_of_transactions",
                prop: "numberOfTransactions",
            },
            {
                name: "total_amount",
                prop: "totalAmount",
                init: col => bignumify(col.value).toFixed(),
            },
            {
                name: "total_fee",
                prop: "totalFee",
                init: col => bignumify(col.value).toFixed(),
            },
            {
                name: "reward",
                init: col => bignumify(col.value).toFixed(),
            },
            {
                name: "payload_length",
                prop: "payloadLength",
            },
            {
                name: "payload_hash",
                prop: "payloadHash",
            },
            {
                name: "generator_public_key",
                prop: "generatorPublicKey",
            },
            {
                name: "block_signature",
                prop: "blockSignature",
            },
        ]);
    }
}
