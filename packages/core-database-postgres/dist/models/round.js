"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_interfaces_1 = require("@arkecosystem/core-interfaces");
const crypto_1 = require("@arkecosystem/crypto");
const model_1 = require("./model");
class Round extends model_1.Model {
    constructor() {
        super(...arguments);
        this.columnsDescriptor = [
            {
                name: "public_key",
                prop: "publicKey",
                supportedOperators: [core_interfaces_1.Database.SearchOperator.OP_EQ],
            },
            {
                name: "balance",
                init: col => {
                    return crypto_1.Utils.BigNumber.make(col.value).toFixed();
                },
                supportedOperators: [
                    core_interfaces_1.Database.SearchOperator.OP_EQ,
                    core_interfaces_1.Database.SearchOperator.OP_LTE,
                    core_interfaces_1.Database.SearchOperator.OP_GTE,
                ],
            },
            {
                name: "round",
                supportedOperators: [
                    core_interfaces_1.Database.SearchOperator.OP_EQ,
                    core_interfaces_1.Database.SearchOperator.OP_LTE,
                    core_interfaces_1.Database.SearchOperator.OP_GTE,
                ],
            },
        ];
    }
    getTable() {
        return "rounds";
    }
}
exports.Round = Round;
//# sourceMappingURL=round.js.map