"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nanomatch_1 = __importDefault(require("nanomatch"));
exports.isWhitelisted = (whitelist, ip) => {
    if (Array.isArray(whitelist)) {
        for (const item of whitelist) {
            if (nanomatch_1.default.isMatch(ip, item)) {
                return true;
            }
        }
    }
    return false;
};
//# sourceMappingURL=is-whitelisted.js.map