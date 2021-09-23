"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_utils_1 = require("@arkecosystem/core-utils");
class TransactionStore extends core_utils_1.OrderedCappedMap {
    push(value) {
        this.set(value.id, value);
    }
}
exports.TransactionStore = TransactionStore;
//# sourceMappingURL=transactions.js.map