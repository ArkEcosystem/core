"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_interfaces_1 = require("@arkecosystem/core-interfaces");
const crypto_1 = require("@arkecosystem/crypto");
const model_1 = require("./model");
class Transaction extends model_1.Model {
    constructor() {
        super(...arguments);
        this.columnsDescriptor = [
            {
                name: "id",
                supportedOperators: [core_interfaces_1.Database.SearchOperator.OP_EQ, core_interfaces_1.Database.SearchOperator.OP_IN],
            },
            {
                name: "version",
                supportedOperators: [core_interfaces_1.Database.SearchOperator.OP_EQ, core_interfaces_1.Database.SearchOperator.OP_IN],
            },
            {
                name: "block_id",
                prop: "blockId",
                supportedOperators: [core_interfaces_1.Database.SearchOperator.OP_EQ, core_interfaces_1.Database.SearchOperator.OP_IN],
            },
            {
                name: "sequence",
                supportedOperators: [core_interfaces_1.Database.SearchOperator.OP_EQ],
            },
            {
                name: "timestamp",
                supportedOperators: [
                    core_interfaces_1.Database.SearchOperator.OP_LTE,
                    core_interfaces_1.Database.SearchOperator.OP_GTE,
                    core_interfaces_1.Database.SearchOperator.OP_EQ,
                ],
            },
            {
                name: "sender_public_key",
                prop: "senderPublicKey",
                supportedOperators: [core_interfaces_1.Database.SearchOperator.OP_EQ, core_interfaces_1.Database.SearchOperator.OP_IN],
            },
            {
                name: "recipient_id",
                prop: "recipientId",
                supportedOperators: [core_interfaces_1.Database.SearchOperator.OP_EQ, core_interfaces_1.Database.SearchOperator.OP_IN],
                def: undefined,
            },
            {
                name: "type",
                supportedOperators: [core_interfaces_1.Database.SearchOperator.OP_EQ, core_interfaces_1.Database.SearchOperator.OP_IN],
            },
            {
                name: "type_group",
                prop: "typeGroup",
                supportedOperators: [core_interfaces_1.Database.SearchOperator.OP_EQ, core_interfaces_1.Database.SearchOperator.OP_IN],
            },
            {
                name: "vendor_field",
                prop: "vendorField",
                init: col => col.value !== undefined ? Buffer.from(col.value, 'utf8') : undefined,
                supportedOperators: [
                    core_interfaces_1.Database.SearchOperator.OP_EQ,
                    core_interfaces_1.Database.SearchOperator.OP_IN,
                    core_interfaces_1.Database.SearchOperator.OP_LIKE
                ],
                def: undefined,
            },
            {
                name: "amount",
                init: col => crypto_1.Utils.BigNumber.make(col.value).toFixed(),
                supportedOperators: [
                    core_interfaces_1.Database.SearchOperator.OP_LTE,
                    core_interfaces_1.Database.SearchOperator.OP_GTE,
                    core_interfaces_1.Database.SearchOperator.OP_EQ,
                ],
            },
            {
                name: "fee",
                init: col => crypto_1.Utils.BigNumber.make(col.value).toFixed(),
                supportedOperators: [
                    core_interfaces_1.Database.SearchOperator.OP_LTE,
                    core_interfaces_1.Database.SearchOperator.OP_GTE,
                    core_interfaces_1.Database.SearchOperator.OP_EQ,
                ],
            },
            {
                name: "serialized",
                supportedOperators: [core_interfaces_1.Database.SearchOperator.OP_EQ],
            },
            {
                name: "asset",
                init: col => {
                    return col.value;
                },
                supportedOperators: [core_interfaces_1.Database.SearchOperator.OP_CONTAINS],
            },
            {
                name: "nonce",
                init: col => col.value !== undefined ? crypto_1.Utils.BigNumber.make(col.value).toFixed() : undefined,
                supportedOperators: [
                    core_interfaces_1.Database.SearchOperator.OP_LTE,
                    core_interfaces_1.Database.SearchOperator.OP_GTE,
                    core_interfaces_1.Database.SearchOperator.OP_EQ,
                ],
                def: undefined,
            },
        ];
    }
    getTable() {
        return "transactions";
    }
}
exports.Transaction = Transaction;
//# sourceMappingURL=transaction.js.map