"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypto_1 = require("bcrypto");
const __1 = require("..");
const errors_1 = require("../errors");
const managers_1 = require("../managers");
const address_1 = require("./address");
const keys_1 = require("./keys");
class PublicKey {
    static fromPassphrase(passphrase) {
        return keys_1.Keys.fromPassphrase(passphrase).publicKey;
    }
    static fromWIF(wif, network) {
        return keys_1.Keys.fromWIF(wif, network).publicKey;
    }
    static fromMultiSignatureAsset(asset) {
        const { min, publicKeys } = asset;
        for (const publicKey of publicKeys) {
            if (!/^[0-9A-Fa-f]{66}$/.test(publicKey)) {
                throw new errors_1.PublicKeyError(publicKey);
            }
        }
        if (min < 1 || min > publicKeys.length) {
            throw new errors_1.InvalidMultiSignatureAssetError();
        }
        const minKey = PublicKey.fromPassphrase(__1.Utils.numberToHex(min));
        const keys = [minKey, ...publicKeys];
        return bcrypto_1.secp256k1
            .publicKeyCombine(keys.map((publicKey) => Buffer.from(publicKey, "hex")))
            .toString("hex");
    }
    static validate(publicKey, networkVersion) {
        if (!networkVersion) {
            networkVersion = managers_1.configManager.get("network.pubKeyHash");
        }
        try {
            return address_1.Address.fromPublicKey(publicKey, networkVersion).length === 34;
        }
        catch (e) {
            return false;
        }
    }
}
exports.PublicKey = PublicKey;
//# sourceMappingURL=public-key.js.map