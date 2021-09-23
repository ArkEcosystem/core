"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("../crypto");
const utils_1 = require("../utils");
const utils_2 = require("./utils");
class Signer {
    static sign(transaction, keys, options) {
        options = options || { excludeSignature: true, excludeSecondSignature: true };
        const hash = utils_2.Utils.toHash(transaction, options);
        const signature = transaction.version > 1 ? crypto_1.Hash.signSchnorr(hash, keys) : crypto_1.Hash.signECDSA(hash, keys);
        if (!transaction.signature && !options.excludeMultiSignature) {
            transaction.signature = signature;
        }
        return signature;
    }
    static secondSign(transaction, keys) {
        const hash = utils_2.Utils.toHash(transaction, { excludeSecondSignature: true });
        const signature = transaction.version > 1 ? crypto_1.Hash.signSchnorr(hash, keys) : crypto_1.Hash.signECDSA(hash, keys);
        if (!transaction.secondSignature) {
            transaction.secondSignature = signature;
        }
        return signature;
    }
    static multiSign(transaction, keys, index = -1) {
        if (!transaction.signatures) {
            transaction.signatures = [];
        }
        index = index === -1 ? transaction.signatures.length : index;
        const hash = utils_2.Utils.toHash(transaction, {
            excludeSignature: true,
            excludeSecondSignature: true,
            excludeMultiSignature: true,
        });
        const signature = crypto_1.Hash.signSchnorr(hash, keys);
        const indexedSignature = `${utils_1.numberToHex(index)}${signature}`;
        transaction.signatures.push(indexedSignature);
        return indexedSignature;
    }
}
exports.Signer = Signer;
//# sourceMappingURL=signer.js.map