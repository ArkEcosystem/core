"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bstring_1 = require("bstring");
const fast_memoize_1 = __importDefault(require("fast-memoize"));
const crypto_1 = require("../crypto");
const encodeCheck = (buffer) => {
    const checksum = crypto_1.HashAlgorithms.hash256(buffer);
    return bstring_1.base58.encode(Buffer.concat([buffer, checksum], buffer.length + 4));
};
const decodeCheck = (address) => {
    const buffer = bstring_1.base58.decode(address);
    const payload = buffer.slice(0, -4);
    const checksum = crypto_1.HashAlgorithms.hash256(payload);
    if (checksum.readUInt32LE(0) !== buffer.slice(-4).readUInt32LE(0)) {
        throw new Error("Invalid checksum");
    }
    return payload;
};
exports.Base58 = {
    encodeCheck: fast_memoize_1.default(encodeCheck),
    decodeCheck: fast_memoize_1.default(decodeCheck),
};
//# sourceMappingURL=base58.js.map