"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@arkecosystem/utils");
const lodash_isequal_1 = __importDefault(require("lodash.isequal"));
const isValidPeer = peer => {
    const allowedKeys = utils_1.sortBy(["ip", "port"]);
    const actualKeys = Object.keys(peer).filter(key => allowedKeys.includes(key));
    return lodash_isequal_1.default(utils_1.sortBy(actualKeys), allowedKeys);
};
expect.extend({
    toBeValidPeer: (actual, expected) => {
        return {
            message: () => `Expected ${JSON.stringify(actual)} to be a valid peer`,
            pass: isValidPeer(actual),
        };
    },
    toBeValidArrayOfPeers: (actual, expected) => {
        const message = () => `Expected ${JSON.stringify(actual)} to be a valid array of peers`;
        if (!Array.isArray(actual)) {
            return { message, pass: false };
        }
        for (const peer of actual) {
            if (!isValidPeer(peer)) {
                return { message, pass: false };
            }
        }
        return { message, pass: true };
    },
});
//# sourceMappingURL=peer.js.map