import { Database } from "@arkecosystem/core-interfaces";
import { Utils } from "@arkecosystem/crypto";
import { IColumnDescriptor } from "../interfaces";
import { Model } from "./model";

export class Transaction extends Model {
    protected columnsDescriptor: IColumnDescriptor[] = [
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
            def: undefined,
        },
        {
            name: "type",
            supportedOperators: [Database.SearchOperator.OP_EQ, Database.SearchOperator.OP_IN],
        },
        {
            name: "vendor_field_hex",
            prop: "vendorFieldHex",
            supportedOperators: [Database.SearchOperator.OP_LIKE],
            def: undefined,
        },
        {
            name: "amount",
            init: col => Utils.BigNumber.make(col.value).toFixed(),
            supportedOperators: [
                Database.SearchOperator.OP_LTE,
                Database.SearchOperator.OP_GTE,
                Database.SearchOperator.OP_EQ,
            ],
        },
        {
            name: "fee",
            init: col => Utils.BigNumber.make(col.value).toFixed(),
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

    public getTable(): string {
        return "transactions";
    }
}
