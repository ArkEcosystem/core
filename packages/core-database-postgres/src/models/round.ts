import { Database } from "@arkecosystem/core-interfaces";
import { bignumify } from "@arkecosystem/core-utils";
import { Model } from "./model";

export class Round extends Model {
    constructor(pgp) {
        super(pgp);
        this.columnsDescriptor = [
            {
                name: "public_key",
                prop: "publicKey",
                supportedOperators: [Database.SearchOperator.OP_EQ],
            },
            {
                name: "balance",
                prop: "voteBalance",
                init: col => bignumify(col.value).toFixed(),
                supportedOperators: [
                    Database.SearchOperator.OP_EQ,
                    Database.SearchOperator.OP_LTE,
                    Database.SearchOperator.OP_GTE,
                ],
            },
            {
                name: "round",
                supportedOperators: [
                    Database.SearchOperator.OP_EQ,
                    Database.SearchOperator.OP_LTE,
                    Database.SearchOperator.OP_GTE,
                ],
            },
        ];
    }

    /**
     * The table associated with the model.
     * @return {String}
     */
    public getTable() {
        return "rounds";
    }
}
