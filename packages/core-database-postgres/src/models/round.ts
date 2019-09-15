import { Database } from "@arkecosystem/core-interfaces";
import { Utils } from "@arkecosystem/crypto";
import { IColumnDescriptor } from "../interfaces";
import { Model } from "./model";

export class Round extends Model {
    protected columnsDescriptor: IColumnDescriptor[] = [
        {
            name: "public_key",
            prop: "publicKey",
            supportedOperators: [Database.SearchOperator.OP_EQ],
        },
        {
            name: "balance",
            init: col => {
                return Utils.BigNumber.make(col.value).toFixed();
            },
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

    public getTable(): string {
        return "rounds";
    }
}
