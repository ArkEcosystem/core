import { Database } from "@arkecosystem/core-interfaces";
import { Utils } from "@arkecosystem/crypto";
import { IColumnDescriptor } from "../interfaces";
import { Model } from "./model";

export class Block extends Model {
    protected columnsDescriptor: IColumnDescriptor[] = [
        {
            name: "id",
            supportedOperators: [Database.SearchOperator.OP_EQ, Database.SearchOperator.OP_IN],
        },
        {
            name: "version",
            supportedOperators: [Database.SearchOperator.OP_EQ],
        },
        {
            name: "timestamp",
            supportedOperators: [Database.SearchOperator.OP_LTE, Database.SearchOperator.OP_GTE],
        },
        {
            name: "previous_block",
            prop: "previousBlock",
            def: undefined,
            supportedOperators: [Database.SearchOperator.OP_EQ],
        },
        {
            name: "height",
            supportedOperators: [
                Database.SearchOperator.OP_EQ,
                Database.SearchOperator.OP_IN,
                Database.SearchOperator.OP_LTE,
                Database.SearchOperator.OP_GTE,
            ],
        },
        {
            name: "number_of_transactions",
            prop: "numberOfTransactions",
            supportedOperators: [Database.SearchOperator.OP_LTE, Database.SearchOperator.OP_GTE],
        },
        {
            name: "total_amount",
            prop: "totalAmount",
            init: col => Utils.BigNumber.make(col.value).toFixed(),
            supportedOperators: [Database.SearchOperator.OP_LTE, Database.SearchOperator.OP_GTE],
        },
        {
            name: "total_fee",
            prop: "totalFee",
            init: col => Utils.BigNumber.make(col.value).toFixed(),
            supportedOperators: [Database.SearchOperator.OP_LTE, Database.SearchOperator.OP_GTE],
        },
        {
            name: "reward",
            init: col => Utils.BigNumber.make(col.value).toFixed(),
            supportedOperators: [Database.SearchOperator.OP_LTE, Database.SearchOperator.OP_GTE],
        },
        {
            name: "payload_length",
            prop: "payloadLength",
            supportedOperators: [Database.SearchOperator.OP_LTE, Database.SearchOperator.OP_GTE],
        },
        {
            name: "payload_hash",
            prop: "payloadHash",
            supportedOperators: [Database.SearchOperator.OP_EQ],
        },
        {
            name: "generator_public_key",
            prop: "generatorPublicKey",
            supportedOperators: [Database.SearchOperator.OP_EQ, Database.SearchOperator.OP_IN],
        },
        {
            name: "block_signature",
            prop: "blockSignature",
            supportedOperators: [Database.SearchOperator.OP_EQ],
        },
    ];

    public getTable(): string {
        return "blocks";
    }
}
