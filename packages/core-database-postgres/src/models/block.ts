import { Contracts } from "@arkecosystem/core-kernel";
import { Utils } from "@arkecosystem/crypto";
import { IColumnDescriptor } from "../interfaces";
import { Model } from "./model";

export class Block extends Model {
    protected columnsDescriptor: IColumnDescriptor[] = [
        {
            name: "id",
            supportedOperators: [Contracts.Database.SearchOperator.OP_EQ, Contracts.Database.SearchOperator.OP_IN],
        },
        {
            name: "version",
            supportedOperators: [Contracts.Database.SearchOperator.OP_EQ],
        },
        {
            name: "timestamp",
            supportedOperators: [Contracts.Database.SearchOperator.OP_LTE, Contracts.Database.SearchOperator.OP_GTE],
        },
        {
            name: "previous_block",
            prop: "previousBlock",
            def: undefined,
            supportedOperators: [Contracts.Database.SearchOperator.OP_EQ],
        },
        {
            name: "height",
            supportedOperators: [
                Contracts.Database.SearchOperator.OP_EQ,
                Contracts.Database.SearchOperator.OP_IN,
                Contracts.Database.SearchOperator.OP_LTE,
                Contracts.Database.SearchOperator.OP_GTE,
            ],
        },
        {
            name: "number_of_transactions",
            prop: "numberOfTransactions",
            supportedOperators: [Contracts.Database.SearchOperator.OP_LTE, Contracts.Database.SearchOperator.OP_GTE],
        },
        {
            name: "total_amount",
            prop: "totalAmount",
            init: col => Utils.BigNumber.make(col.value).toFixed(),
            supportedOperators: [Contracts.Database.SearchOperator.OP_LTE, Contracts.Database.SearchOperator.OP_GTE],
        },
        {
            name: "total_fee",
            prop: "totalFee",
            init: col => Utils.BigNumber.make(col.value).toFixed(),
            supportedOperators: [Contracts.Database.SearchOperator.OP_LTE, Contracts.Database.SearchOperator.OP_GTE],
        },
        {
            name: "reward",
            init: col => Utils.BigNumber.make(col.value).toFixed(),
            supportedOperators: [Contracts.Database.SearchOperator.OP_LTE, Contracts.Database.SearchOperator.OP_GTE],
        },
        {
            name: "payload_length",
            prop: "payloadLength",
            supportedOperators: [Contracts.Database.SearchOperator.OP_LTE, Contracts.Database.SearchOperator.OP_GTE],
        },
        {
            name: "payload_hash",
            prop: "payloadHash",
            supportedOperators: [Contracts.Database.SearchOperator.OP_EQ],
        },
        {
            name: "generator_public_key",
            prop: "generatorPublicKey",
            supportedOperators: [Contracts.Database.SearchOperator.OP_EQ, Contracts.Database.SearchOperator.OP_IN],
        },
        {
            name: "block_signature",
            prop: "blockSignature",
            supportedOperators: [Contracts.Database.SearchOperator.OP_EQ],
        },
    ];

    public getTable(): string {
        return "blocks";
    }
}
