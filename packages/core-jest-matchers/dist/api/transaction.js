"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@arkecosystem/utils");
const lodash_isequal_1 = __importDefault(require("lodash.isequal"));
expect.extend({
    toBeApiTransaction: (actual, expected) => {
        // TODO based on type
        const allowedKeys = utils_1.sortBy([
            "id",
            "blockid",
            "type",
            "timestamp",
            "amount",
            "fee",
            "senderId",
            "senderPublicKey",
            "signature",
            "asset",
            "confirmations",
        ]);
        const actualKeys = Object.keys(actual).filter(key => allowedKeys.includes(key));
        return {
            message: () => `Expected ${JSON.stringify(actual)} to be a valid transaction`,
            pass: lodash_isequal_1.default(utils_1.sortBy(actualKeys), allowedKeys),
        };
    },
});
//# sourceMappingURL=transaction.js.map