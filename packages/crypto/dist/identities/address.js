"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("../crypto");
const errors_1 = require("../errors");
const managers_1 = require("../managers");
const base58_1 = require("../utils/base58");
const public_key_1 = require("./public-key");
class Address {
    static fromPassphrase(passphrase, networkVersion) {
        return Address.fromPublicKey(public_key_1.PublicKey.fromPassphrase(passphrase), networkVersion);
    }
    static fromPublicKey(publicKey, networkVersion) {
        if (!/^[0-9A-Fa-f]{66}$/.test(publicKey)) {
            throw new errors_1.PublicKeyError(publicKey);
        }
        if (!networkVersion) {
            networkVersion = managers_1.configManager.get("network.pubKeyHash");
        }
        const buffer = crypto_1.HashAlgorithms.ripemd160(Buffer.from(publicKey, "hex"));
        const payload = Buffer.alloc(21);
        payload.writeUInt8(networkVersion, 0);
        buffer.copy(payload, 1);
        return this.fromBuffer(payload);
    }
    static fromWIF(wif, network) {
        return Address.fromPublicKey(public_key_1.PublicKey.fromWIF(wif, network));
    }
    static fromMultiSignatureAsset(asset, networkVersion) {
        return this.fromPublicKey(public_key_1.PublicKey.fromMultiSignatureAsset(asset), networkVersion);
    }
    static fromPrivateKey(privateKey, networkVersion) {
        return Address.fromPublicKey(privateKey.publicKey, networkVersion);
    }
    static fromBuffer(buffer) {
        return base58_1.Base58.encodeCheck(buffer);
    }
    static toBuffer(address) {
        const buffer = base58_1.Base58.decodeCheck(address);
        const networkVersion = managers_1.configManager.get("network.pubKeyHash");
        const result = {
            addressBuffer: buffer,
        };
        if (buffer[0] !== networkVersion) {
            result.addressError = `Expected address network byte ${networkVersion}, but got ${buffer[0]}.`;
        }
        return result;
    }
    static validate(address, networkVersion) {
        if (!networkVersion) {
            networkVersion = managers_1.configManager.get("network.pubKeyHash");
        }
        try {
            return base58_1.Base58.decodeCheck(address)[0] === networkVersion;
        }
        catch (err) {
            return false;
        }
    }
}
exports.Address = Address;
//# sourceMappingURL=address.js.map