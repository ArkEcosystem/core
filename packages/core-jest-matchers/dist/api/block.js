"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@arkecosystem/utils");
const lodash_isequal_1 = __importDefault(require("lodash.isequal"));
const isValidBlock = block => {
    const allowedKeys = utils_1.sortBy([
        "blockSignature",
        "createdAt",
        "generatorPublicKey",
        "height",
        "id",
        "numberOfTransactions",
        "payloadHash",
        "payloadLength",
        "previousBlock",
        "reward",
        "timestamp",
        "totalAmount",
        "totalFee",
        "transactions",
        "updatedAt",
        "version",
    ]);
    const actualKeys = Object.keys(block).filter(key => allowedKeys.includes(key));
    return lodash_isequal_1.default(utils_1.sortBy(actualKeys), allowedKeys);
};
expect.extend({
    toBeValidBlock: (actual, expected) => {
        return {
            message: () => `Expected ${JSON.stringify(actual)} to be a valid block`,
            pass: isValidBlock(actual),
        };
    },
    toBeValidArrayOfBlocks: (actual, expected) => {
        const message = () => `Expected ${JSON.stringify(actual)} to be a valid array of blocks`;
        if (!Array.isArray(actual)) {
            return { message, pass: false };
        }
        for (const peer of actual) {
            if (!isValidBlock(peer)) {
                return { message, pass: false };
            }
        }
        return { message, pass: true };
    },
});
//# sourceMappingURL=block.js.map