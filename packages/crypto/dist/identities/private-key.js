"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const keys_1 = require("./keys");
class PrivateKey {
    static fromPassphrase(passphrase) {
        return keys_1.Keys.fromPassphrase(passphrase).privateKey;
    }
    static fromWIF(wif, network) {
        return keys_1.Keys.fromWIF(wif, network).privateKey;
    }
}
exports.PrivateKey = PrivateKey;
//# sourceMappingURL=private-key.js.map