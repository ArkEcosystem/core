import { Database } from "@arkecosystem/core-interfaces";
import { bignumify } from "@arkecosystem/core-utils";
import { Model } from "./model";

export class Wallet extends Model {

    private readonly columnsDescriptor: any[];
    private columnSet: any[];

    constructor(pgp) {
        super(pgp);

        this.columnsDescriptor = [
            {
                name: "address",
                supportedOperators: [ Database.SearchOperator.OP_EQ, Database.SearchOperator.OP_IN ]
            },
            {
                name: "public_key",
                prop: "publicKey",
                supportedOperators: [ Database.SearchOperator.OP_EQ, Database.SearchOperator.OP_IN ]
            },
            {
                name: "second_public_key",
                prop: "secondPublicKey",
                supportedOperators: [ Database.SearchOperator.OP_EQ, Database.SearchOperator.OP_IN ]
            },
            {
                name: "vote",
                supportedOperators: [ Database.SearchOperator.OP_EQ ]
            },
            {
                name: "username",
                supportedOperators: [ Database.SearchOperator.OP_EQ, Database.SearchOperator.OP_LIKE]
            },
            {
                name: "balance",
                init: col => bignumify(col.value).toFixed(),
                supportedOperators: [ Database.SearchOperator.OP_EQ, Database.SearchOperator.OP_GTE, Database.SearchOperator.OP_LTE ]
            },
            {
                name: "vote_balance",
                prop: "voteBalance",
                init: col => (col.value ? bignumify(col.value).toFixed() : null),
                supportedOperators: [ Database.SearchOperator.OP_EQ, Database.SearchOperator.OP_GTE, Database.SearchOperator.OP_LTE ]
            },
            {
                name: "produced_blocks",
                prop: "producedBlocks",
                supportedOperators: [ Database.SearchOperator.OP_EQ, Database.SearchOperator.OP_GTE, Database.SearchOperator.OP_LTE ]
            },
            {
                name: "missed_blocks",
                prop: "missedBlocks",
                supportedOperators: [ Database.SearchOperator.OP_EQ, Database.SearchOperator.OP_GTE, Database.SearchOperator.OP_LTE ]
            }
        ]
    }

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
        return "Wallet";
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
