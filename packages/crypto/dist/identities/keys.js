"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypto_1 = require("bcrypto");
const wif_1 = __importDefault(require("wif"));
const crypto_1 = require("../crypto");
const errors_1 = require("../errors");
const managers_1 = require("../managers");
class Keys {
    static fromPassphrase(passphrase, compressed = true) {
        return Keys.fromPrivateKey(crypto_1.HashAlgorithms.sha256(Buffer.from(passphrase, "utf8")), compressed);
    }
    static fromPrivateKey(privateKey, compressed = true) {
        privateKey = privateKey instanceof Buffer ? privateKey : Buffer.from(privateKey, "hex");
        return {
            publicKey: bcrypto_1.secp256k1.publicKeyCreate(privateKey, compressed).toString("hex"),
            privateKey: privateKey.toString("hex"),
            compressed,
        };
    }
    static fromWIF(wifKey, network) {
        if (!network) {
            network = managers_1.configManager.get("network");
        }
        const { version, compressed, privateKey } = wif_1.default.decode(wifKey, network.wif);
        if (version !== network.wif) {
            throw new errors_1.NetworkVersionError(network.wif, version);
        }
        return {
            publicKey: bcrypto_1.secp256k1.publicKeyCreate(privateKey, compressed).toString("hex"),
            privateKey: privateKey.toString("hex"),
            compressed,
        };
    }
}
exports.Keys = Keys;
//# sourceMappingURL=keys.js.map