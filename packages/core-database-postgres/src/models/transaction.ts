import { Database } from "@arkecosystem/core-interfaces";
import { bignumify } from "@arkecosystem/core-utils";
import { Model } from "./model";

export class Transaction extends Model {
    private readonly columnsDescriptor: any[];
    private columnSet: any[];

    constructor(pgp) {
        super(pgp);

        this.columnsDescriptor = [
            {
                name: "id",
                supportedOperators: [ Database.SearchOperator.OP_EQ, Database.SearchOperator.OP_IN ]
            },
            {
                name: "version",
                supportedOperators: [ Database.SearchOperator.OP_EQ, Database.SearchOperator.OP_IN ]
            },
            {
                name: "block_id",
                prop: "blockId",
                supportedOperators: [ Database.SearchOperator.OP_EQ, Database.SearchOperator.OP_IN ]
            },
            {
                name: "sequence",
                supportedOperators: [ Database.SearchOperator.OP_EQ ]
            },
            {
                name: "timestamp",
                supportedOperators: [ Database.SearchOperator.OP_LTE, Database.SearchOperator.OP_GTE, Database.SearchOperator.OP_EQ ]
            },
            {
                name: "sender_public_key",
                prop: "senderPublicKey",
                supportedOperators: [ Database.SearchOperator.OP_EQ, Database.SearchOperator.OP_IN ]
            },
            {
                name: "recipient_id",
                prop: "recipientId",
                supportedOperators: [ Database.SearchOperator.OP_EQ, Database.SearchOperator.OP_IN ]
            },
            {
                name: "type",
                supportedOperators: [ Database.SearchOperator.OP_EQ, Database.SearchOperator.OP_IN ]
            },
            {
                name: "vendor_field_hex",
                prop: "vendorFieldHex",
                supportedOperators: [ Database.SearchOperator.OP_LIKE ]
            },
            {
                name: "amount",
                init: col => bignumify(col.value).toFixed(),
                supportedOperators: [ Database.SearchOperator.OP_LTE, Database.SearchOperator.OP_GTE, Database.SearchOperator.OP_EQ ]
            },
            {
                name: "fee",
                init: col => bignumify(col.value).toFixed(),
                supportedOperators: [ Database.SearchOperator.OP_LTE, Database.SearchOperator.OP_GTE, Database.SearchOperator.OP_EQ ]
            },
            {
                name: "serialized",
                init: col => Buffer.from(col.value, "hex"),
                supportedOperators: [ Database.SearchOperator.OP_EQ ]
            }
        ]
    }

    /**
     * The table associated with the model.
     * @return {String}
     */
    public getTable() {
        return "transactions";
    }

    /**
     * The read-only structure with query-formatting columns.
     * @return {Object}
     */
    public getColumnSet() {
        if(!this.columnSet) {
            this.columnSet = this.createColumnSet(this.columnsDescriptor.map(col => {
                const colDef: any = {
                    name : col.name
                };
                ["prop", "init", "def"].forEach(prop => {
                    if(col.hasOwnProperty(prop)) {
                        colDef[prop] = col[prop];
                    }
                });
                return colDef;
            }))
        }
        return this.columnSet;
    }

    public getName(): string {
        return "Transaction";
    }

    public getSearchableFields(): Database.SearchableField[] {
        return this.columnsDescriptor.map(col => {
            return {
                fieldName: col.prop || col.name,
                supportedOperators: col.supportedOperators
            }
        });
    }
}
