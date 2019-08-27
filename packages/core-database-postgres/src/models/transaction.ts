import { Contracts } from "@arkecosystem/core-kernel";
import { Utils } from "@arkecosystem/crypto";
import { ColumnDescriptor } from "../interfaces";
import { Model } from "./model";

export class Transaction extends Model {
    protected columnsDescriptor: ColumnDescriptor[] = [
        {
            name: "id",
            supportedOperators: [Contracts.Database.SearchOperator.OP_EQ, Contracts.Database.SearchOperator.OP_IN],
        },
        {
            name: "version",
            supportedOperators: [Contracts.Database.SearchOperator.OP_EQ, Contracts.Database.SearchOperator.OP_IN],
        },
        {
            name: "block_id",
            prop: "blockId",
            supportedOperators: [Contracts.Database.SearchOperator.OP_EQ, Contracts.Database.SearchOperator.OP_IN],
        },
        {
            name: "sequence",
            supportedOperators: [Contracts.Database.SearchOperator.OP_EQ],
        },
        {
            name: "timestamp",
            supportedOperators: [
                Contracts.Database.SearchOperator.OP_LTE,
                Contracts.Database.SearchOperator.OP_GTE,
                Contracts.Database.SearchOperator.OP_EQ,
            ],
        },
        {
            name: "sender_public_key",
            prop: "senderPublicKey",
            supportedOperators: [Contracts.Database.SearchOperator.OP_EQ, Contracts.Database.SearchOperator.OP_IN],
        },
        {
            name: "recipient_id",
            prop: "recipientId",
            supportedOperators: [Contracts.Database.SearchOperator.OP_EQ, Contracts.Database.SearchOperator.OP_IN],
            def: undefined,
        },
        {
            name: "type",
            supportedOperators: [Contracts.Database.SearchOperator.OP_EQ, Contracts.Database.SearchOperator.OP_IN],
        },
        {
            name: "type_group",
            prop: "typeGroup",
            supportedOperators: [Contracts.Database.SearchOperator.OP_EQ, Contracts.Database.SearchOperator.OP_IN],
        },
        {
            name: "vendor_field_hex",
            prop: "vendorFieldHex",
            supportedOperators: [Contracts.Database.SearchOperator.OP_LIKE],
            def: undefined,
        },
        {
            name: "amount",
            init: col => Utils.BigNumber.make(col.value).toFixed(),
            supportedOperators: [
                Contracts.Database.SearchOperator.OP_LTE,
                Contracts.Database.SearchOperator.OP_GTE,
                Contracts.Database.SearchOperator.OP_EQ,
            ],
        },
        {
            name: "fee",
            init: col => Utils.BigNumber.make(col.value).toFixed(),
            supportedOperators: [
                Contracts.Database.SearchOperator.OP_LTE,
                Contracts.Database.SearchOperator.OP_GTE,
                Contracts.Database.SearchOperator.OP_EQ,
            ],
        },
        {
            name: "serialized",
            supportedOperators: [Contracts.Database.SearchOperator.OP_EQ],
        },
        {
            name: "asset",
            init: col => {
                return col.value;
            },
            supportedOperators: [Contracts.Database.SearchOperator.OP_CONTAINS],
        },
        {
            name: "nonce",
            init: col => (col.value !== undefined ? Utils.BigNumber.make(col.value).toFixed() : undefined),
            supportedOperators: [
                Contracts.Database.SearchOperator.OP_LTE,
                Contracts.Database.SearchOperator.OP_GTE,
                Contracts.Database.SearchOperator.OP_EQ,
            ],
            def: undefined,
        },
    ];

    public getTable(): string {
        return "transactions";
    }
}
