"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@arkecosystem/utils");
const lodash_isequal_1 = __importDefault(require("lodash.isequal"));
expect.extend({
    toBeTransaction: actual => {
        // TODO based on type
        const allowedKeys = utils_1.sortBy(["id", "type", "amount", "fee", "timestamp", "signature"]);
        const actualKeys = Object.keys(actual).filter(key => allowedKeys.includes(key));
        return {
            message: () => "Expected value to be a valid transaction",
            pass: lodash_isequal_1.default(utils_1.sortBy(actualKeys), allowedKeys),
        };
    },
});
//# sourceMappingURL=transaction.js.map