import { Database } from "@arkecosystem/core-interfaces";
import { bignumify } from "@arkecosystem/core-utils";
import { Model } from "./model";

export class Block extends Model {

    constructor(pgp) {

        super(pgp);

        this.columnsDescriptor = [
            {
                name: "id",
                supportedOperators: [ Database.SearchOperator.OP_EQ ]
            },
            {
                name: "version",
                supportedOperators: [ Database.SearchOperator.OP_EQ ]
            },
            {
                name: "timestamp",
                supportedOperators: [ Database.SearchOperator.OP_LTE, Database.SearchOperator.OP_GTE ]
            },
            {
                name: "previous_block",
                prop: "previousBlock",
                def: null,
                supportedOperators: [ Database.SearchOperator.OP_EQ ]
            },
            {
                name: "height",
                supportedOperators: [ Database.SearchOperator.OP_LTE, Database.SearchOperator.OP_GTE ]
            },
            {
                name: "number_of_transactions",
                prop: "numberOfTransactions",
                supportedOperators: [ Database.SearchOperator.OP_LTE, Database.SearchOperator.OP_GTE ]
            },
            {
                name: "total_amount",
                prop: "totalAmount",
                init: col => bignumify(col.value).toFixed(),
                supportedOperators: [ Database.SearchOperator.OP_LTE, Database.SearchOperator.OP_GTE ]
            },
            {
                name: "total_fee",
                prop: "totalFee",
                init: col => bignumify(col.value).toFixed(),
                supportedOperators: [ Database.SearchOperator.OP_LTE, Database.SearchOperator.OP_GTE ]
            },
            {
                name: "reward",
                init: col => bignumify(col.value).toFixed(),
                supportedOperators: [ Database.SearchOperator.OP_LTE, Database.SearchOperator.OP_GTE ]
            },
            {
                name: "payload_length",
                prop: "payloadLength",
                supportedOperators: [ Database.SearchOperator.OP_LTE, Database.SearchOperator.OP_GTE ]
            },
            {
                name: "payload_hash",
                prop: "payloadHash",
                supportedOperators: [ Database.SearchOperator.OP_EQ ]
            },
            {
                name: "generator_public_key",
                prop: "generatorPublicKey",
                supportedOperators: [ Database.SearchOperator.OP_EQ ]
            },
            {
                name: "block_signature",
                prop: "blockSignature",
                supportedOperators: [ Database.SearchOperator.OP_EQ ]
            }
        ];
    }

    /**
     * The table associated with the model.
     * @return {String}
     */
    public getTable() {
        return "blocks";
    }

}
