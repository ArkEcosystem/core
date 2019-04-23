import { Database } from "@arkecosystem/core-interfaces";
import { bignumify } from "@arkecosystem/core-utils";
import { Model } from "./model";

export class Transaction extends Model {
    constructor(pgp) {
        super(pgp);

        this.columnsDescriptor = [
            {
                name: "id",
                supportedOperators: [Database.SearchOperator.OP_EQ, Database.SearchOperator.OP_IN],
            },
            {
                name: "version",
                supportedOperators: [Database.SearchOperator.OP_EQ, Database.SearchOperator.OP_IN],
            },
            {
                name: "block_id",
                prop: "blockId",
                supportedOperators: [Database.SearchOperator.OP_EQ, Database.SearchOperator.OP_IN],
            },
            {
                name: "sequence",
                supportedOperators: [Database.SearchOperator.OP_EQ],
            },
            {
                name: "timestamp",
                supportedOperators: [
                    Database.SearchOperator.OP_LTE,
                    Database.SearchOperator.OP_GTE,
                    Database.SearchOperator.OP_EQ,
                ],
            },
            {
                name: "sender_public_key",
                prop: "senderPublicKey",
                supportedOperators: [Database.SearchOperator.OP_EQ, Database.SearchOperator.OP_IN],
            },
            {
                name: "recipient_id",
                prop: "recipientId",
                supportedOperators: [Database.SearchOperator.OP_EQ, Database.SearchOperator.OP_IN],
                def: null,
            },
            {
                name: "type",
                supportedOperators: [Database.SearchOperator.OP_EQ, Database.SearchOperator.OP_IN],
            },
            {
                name: "vendor_field_hex",
                prop: "vendorFieldHex",
                supportedOperators: [Database.SearchOperator.OP_LIKE],
                def: null,
            },
            {
                name: "amount",
                init: col => bignumify(col.value).toFixed(),
                supportedOperators: [
                    Database.SearchOperator.OP_LTE,
                    Database.SearchOperator.OP_GTE,
                    Database.SearchOperator.OP_EQ,
                ],
            },
            {
                name: "fee",
                init: col => bignumify(col.value).toFixed(),
                supportedOperators: [
                    Database.SearchOperator.OP_LTE,
                    Database.SearchOperator.OP_GTE,
                    Database.SearchOperator.OP_EQ,
                ],
            },
            {
                name: "serialized",
                supportedOperators: [Database.SearchOperator.OP_EQ],
            },
            {
                name: "asset",
                init: col => {
                    return col.value;
                },
                supportedOperators: [Database.SearchOperator.OP_EQ],
            },
        ];
    }

    /**
     * The table associated with the model.
     * @return {String}
     */
    public getTable() {
        return "transactions";
    }
}
