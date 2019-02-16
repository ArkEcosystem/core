import { Database } from "@arkecosystem/core-interfaces";
import { bignumify } from "@arkecosystem/core-utils";
import { Model } from "./model";

export class Round extends Model {

    private readonly  columnsDescriptor: any[];
    private columnSet: any[];
    constructor(pgp) {
        super(pgp);
        this.columnsDescriptor = [
            {
                name: "public_key",
                prop: "publicKey",
                supportedOperators: [ Database.SearchOperator.OP_EQ ]
            },
            {
                name: "balance",
                prop: "voteBalance",
                init: col => bignumify(col.value).toFixed(),
                supportedOperators: [ Database.SearchOperator.OP_EQ, Database.SearchOperator.OP_LTE, Database.SearchOperator.OP_GTE ]
            },
            {
                name: "round",
                supportedOperators: [ Database.SearchOperator.OP_EQ, Database.SearchOperator.OP_LTE, Database.SearchOperator.OP_GTE ]
            },
        ]
    }

    /**
     * The table associated with the model.
     * @return {String}
     */
    public getTable() {
        return "rounds";
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
        return "Round";
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
