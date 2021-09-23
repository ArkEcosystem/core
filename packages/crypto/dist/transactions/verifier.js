"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hash_1 = require("../crypto/hash");
const errors_1 = require("../errors");
const managers_1 = require("../managers");
const utils_1 = require("../utils");
const validation_1 = require("../validation");
const types_1 = require("./types");
const utils_2 = require("./utils");
class Verifier {
    static verify(data) {
        if (utils_1.isException(data)) {
            return true;
        }
        if (managers_1.configManager.getMilestone().aip11 && (!data.version || data.version === 1)) {
            return false;
        }
        return Verifier.verifyHash(data);
    }
    static verifySecondSignature(transaction, publicKey) {
        const secondSignature = transaction.secondSignature || transaction.signSignature;
        if (!secondSignature) {
            return false;
        }
        const hash = utils_2.Utils.toHash(transaction, { excludeSecondSignature: true });
        return this.internalVerifySignature(hash, secondSignature, publicKey);
    }
    static verifySignatures(transaction, multiSignature) {
        if (!multiSignature) {
            throw new errors_1.InvalidMultiSignatureAssetError();
        }
        const { publicKeys, min } = multiSignature;
        const { signatures } = transaction;
        const hash = utils_2.Utils.toHash(transaction, {
            excludeSignature: true,
            excludeSecondSignature: true,
            excludeMultiSignature: true,
        });
        const publicKeyIndexes = {};
        let verified = false;
        let verifiedSignatures = 0;
        for (let i = 0; i < signatures.length; i++) {
            const signature = signatures[i];
            const publicKeyIndex = parseInt(signature.slice(0, 2), 16);
            if (!publicKeyIndexes[publicKeyIndex]) {
                publicKeyIndexes[publicKeyIndex] = true;
            }
            else {
                throw new errors_1.DuplicateParticipantInMultiSignatureError();
            }
            const partialSignature = signature.slice(2, 130);
            const publicKey = publicKeys[publicKeyIndex];
            if (hash_1.Hash.verifySchnorr(hash, partialSignature, publicKey)) {
                verifiedSignatures++;
            }
            if (verifiedSignatures === min) {
                verified = true;
                break;
            }
            else if (signatures.length - (i + 1 - verifiedSignatures) < min) {
                break;
            }
        }
        return verified;
    }
    static verifyHash(data) {
        const { signature, senderPublicKey } = data;
        if (!signature) {
            return false;
        }
        const hash = utils_2.Utils.toHash(data, {
            excludeSignature: true,
            excludeSecondSignature: true,
        });
        return this.internalVerifySignature(hash, signature, senderPublicKey);
    }
    static verifySchema(data, strict = true) {
        const { $id } = types_1.TransactionTypeFactory.get(data.type, data.typeGroup).getSchema();
        return validation_1.validator.validate(strict ? `${$id}Strict` : `${$id}`, data);
    }
    static internalVerifySignature(hash, signature, publicKey) {
        const isSchnorr = Buffer.from(signature, "hex").byteLength === 64;
        if (isSchnorr) {
            return hash_1.Hash.verifySchnorr(hash, signature, publicKey);
        }
        return hash_1.Hash.verifyECDSA(hash, signature, publicKey);
    }
}
exports.Verifier = Verifier;
//# sourceMappingURL=verifier.js.map