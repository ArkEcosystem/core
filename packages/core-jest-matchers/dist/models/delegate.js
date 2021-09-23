"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@arkecosystem/utils");
const lodash_isequal_1 = __importDefault(require("lodash.isequal"));
expect.extend({
    toBeDelegate: actual => {
        return {
            message: () => "Expected value to be a valid delegate",
            pass: lodash_isequal_1.default(utils_1.sortBy(Object.keys(actual)), ["address", "publicKey", "username"]),
        };
    },
});
//# sourceMappingURL=delegate.js.map