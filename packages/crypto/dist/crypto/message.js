"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const identities_1 = require("../identities");
const managers_1 = require("../managers");
const hash_1 = require("./hash");
const hash_algorithms_1 = require("./hash-algorithms");
class Message {
    static sign(message, passphrase) {
        const keys = identities_1.Keys.fromPassphrase(passphrase);
        return {
            publicKey: keys.publicKey,
            signature: hash_1.Hash.signECDSA(this.createHash(message), keys),
            message,
        };
    }
    static signWithWif(message, wif, network) {
        if (!network) {
            network = managers_1.configManager.get("network");
        }
        const keys = identities_1.Keys.fromWIF(wif, network);
        return {
            publicKey: keys.publicKey,
            signature: hash_1.Hash.signECDSA(this.createHash(message), keys),
            message,
        };
    }
    static verify({ message, publicKey, signature }) {
        return hash_1.Hash.verifyECDSA(this.createHash(message), signature, publicKey);
    }
    static createHash(message) {
        return hash_algorithms_1.HashAlgorithms.sha256(message);
    }
}
exports.Message = Message;
//# sourceMappingURL=message.js.map