"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_utils_1 = require("@arkecosystem/core-utils");
exports.transformLock = (lock) => {
    return {
        ...lock,
        amount: lock.amount.toFixed(),
        timestamp: core_utils_1.formatTimestamp(lock.timestamp),
    };
};
//# sourceMappingURL=transformer.js.map