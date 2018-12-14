import { bignumify } from "@arkecosystem/core-utils";
import { Model } from "./model";

export class Round extends Model {
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
        return this.createColumnSet([
            {
                name: "public_key",
                prop: "publicKey",
            },
            {
                name: "balance",
                prop: "voteBalance",
                init: col => bignumify(col.value).toFixed(),
            },
            {
                name: "round",
            },
        ]);
    }
}
