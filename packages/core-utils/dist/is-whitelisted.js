"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nanomatch_1 = __importDefault(require("nanomatch"));
exports.isWhitelisted = (whitelist, remoteAddress) => {
    if (!Array.isArray(whitelist) || !whitelist.length) {
        return true;
    }
    if (Array.isArray(whitelist)) {
        for (const ip of whitelist) {
            try {
                if (nanomatch_1.default.isMatch(remoteAddress, ip)) {
                    return true;
                }
            }
            catch (_a) {
                return false;
            }
        }
    }
    return false;
};
//# sourceMappingURL=is-whitelisted.js.map