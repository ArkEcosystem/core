import { Contracts } from "@arkecosystem/core-kernel";
import { Utils } from "@arkecosystem/crypto";
import { ColumnDescriptor } from "../interfaces";
import { Model } from "./model";

export class Round extends Model {
    protected columnsDescriptor: ColumnDescriptor[] = [
        {
            name: "public_key",
            prop: "publicKey",
            supportedOperators: [Contracts.Database.SearchOperator.OP_EQ],
        },
        {
            name: "balance",
            init: col => {
                return Utils.BigNumber.make(col.value).toFixed();
            },
            supportedOperators: [
                Contracts.Database.SearchOperator.OP_EQ,
                Contracts.Database.SearchOperator.OP_LTE,
                Contracts.Database.SearchOperator.OP_GTE,
            ],
        },
        {
            name: "round",
            supportedOperators: [
                Contracts.Database.SearchOperator.OP_EQ,
                Contracts.Database.SearchOperator.OP_LTE,
                Contracts.Database.SearchOperator.OP_GTE,
            ],
        },
    ];

    public getTable(): string {
        return "rounds";
    }
}
