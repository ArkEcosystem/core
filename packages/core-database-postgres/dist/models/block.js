"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_interfaces_1 = require("@arkecosystem/core-interfaces");
const crypto_1 = require("@arkecosystem/crypto");
const model_1 = require("./model");
class Block extends model_1.Model {
    constructor() {
        super(...arguments);
        this.columnsDescriptor = [
            {
                name: "id",
                supportedOperators: [core_interfaces_1.Database.SearchOperator.OP_EQ, core_interfaces_1.Database.SearchOperator.OP_IN],
            },
            {
                name: "version",
                supportedOperators: [core_interfaces_1.Database.SearchOperator.OP_EQ],
            },
            {
                name: "timestamp",
                supportedOperators: [core_interfaces_1.Database.SearchOperator.OP_LTE, core_interfaces_1.Database.SearchOperator.OP_GTE],
            },
            {
                name: "previous_block",
                prop: "previousBlock",
                def: undefined,
                supportedOperators: [core_interfaces_1.Database.SearchOperator.OP_EQ],
            },
            {
                name: "height",
                supportedOperators: [
                    core_interfaces_1.Database.SearchOperator.OP_EQ,
                    core_interfaces_1.Database.SearchOperator.OP_IN,
                    core_interfaces_1.Database.SearchOperator.OP_LTE,
                    core_interfaces_1.Database.SearchOperator.OP_GTE,
                ],
            },
            {
                name: "number_of_transactions",
                prop: "numberOfTransactions",
                supportedOperators: [core_interfaces_1.Database.SearchOperator.OP_LTE, core_interfaces_1.Database.SearchOperator.OP_GTE],
            },
            {
                name: "total_amount",
                prop: "totalAmount",
                init: col => crypto_1.Utils.BigNumber.make(col.value).toFixed(),
                supportedOperators: [core_interfaces_1.Database.SearchOperator.OP_LTE, core_interfaces_1.Database.SearchOperator.OP_GTE],
            },
            {
                name: "total_fee",
                prop: "totalFee",
                init: col => crypto_1.Utils.BigNumber.make(col.value).toFixed(),
                supportedOperators: [core_interfaces_1.Database.SearchOperator.OP_LTE, core_interfaces_1.Database.SearchOperator.OP_GTE],
            },
            {
                name: "reward",
                init: col => crypto_1.Utils.BigNumber.make(col.value).toFixed(),
                supportedOperators: [core_interfaces_1.Database.SearchOperator.OP_LTE, core_interfaces_1.Database.SearchOperator.OP_GTE],
            },
            {
                name: "payload_length",
                prop: "payloadLength",
                supportedOperators: [core_interfaces_1.Database.SearchOperator.OP_LTE, core_interfaces_1.Database.SearchOperator.OP_GTE],
            },
            {
                name: "payload_hash",
                prop: "payloadHash",
                supportedOperators: [core_interfaces_1.Database.SearchOperator.OP_EQ],
            },
            {
                name: "generator_public_key",
                prop: "generatorPublicKey",
                supportedOperators: [core_interfaces_1.Database.SearchOperator.OP_EQ, core_interfaces_1.Database.SearchOperator.OP_IN],
            },
            {
                name: "block_signature",
                prop: "blockSignature",
                supportedOperators: [core_interfaces_1.Database.SearchOperator.OP_EQ],
            },
        ];
    }
    getTable() {
        return "blocks";
    }
}
exports.Block = Block;
//# sourceMappingURL=block.js.map