"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const wif_1 = __importDefault(require("wif"));
const database_1 = require("../services/database");
exports.getBIP38Wallet = async (userId, bip38password) => {
    const encryptedWif = await database_1.database.get(crypto_1.Crypto.HashAlgorithms.sha256(Buffer.from(userId)).toString("hex"));
    return encryptedWif ? exports.decryptWIF(encryptedWif, userId, bip38password) : undefined;
};
exports.decryptWIF = (encryptedWif, userId, bip38password) => {
    const decrypted = crypto_1.Crypto.bip38.decrypt(encryptedWif.toString("hex"), bip38password + userId);
    const encodedWIF = wif_1.default.encode(crypto_1.Managers.configManager.get("network.wif"), decrypted.privateKey, decrypted.compressed);
    return { keys: crypto_1.Identities.Keys.fromWIF(encodedWIF), wif: encodedWIF };
};
//# sourceMappingURL=crypto.js.map