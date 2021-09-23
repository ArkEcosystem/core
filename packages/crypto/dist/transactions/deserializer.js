"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bytebuffer_1 = __importDefault(require("bytebuffer"));
const enums_1 = require("../enums");
const errors_1 = require("../errors");
const identities_1 = require("../identities");
const utils_1 = require("../utils");
const types_1 = require("./types");
// Reference: https://github.com/ArkEcosystem/AIPs/blob/master/AIPS/aip-11.md
class Deserializer {
    static deserialize(serialized, options = {}) {
        const data = {};
        const buffer = this.getByteBuffer(serialized);
        this.deserializeCommon(data, buffer);
        const instance = types_1.TransactionTypeFactory.create(data);
        this.deserializeVendorField(instance, buffer);
        // Deserialize type specific parts
        instance.deserialize(buffer);
        this.deserializeSignatures(data, buffer);
        if (options.acceptLegacyVersion || utils_1.isSupportedTransactionVersion(data.version)) {
            if (data.version === 1) {
                this.applyV1Compatibility(data);
            }
        }
        else {
            throw new errors_1.TransactionVersionError(data.version);
        }
        instance.serialized = buffer.flip().toBuffer();
        return instance;
    }
    static deserializeCommon(transaction, buf) {
        buf.skip(1); // Skip 0xFF marker
        transaction.version = buf.readUint8();
        transaction.network = buf.readUint8();
        if (transaction.version === 1) {
            transaction.type = buf.readUint8();
            transaction.timestamp = buf.readUint32();
        }
        else {
            transaction.typeGroup = buf.readUint32();
            transaction.type = buf.readUint16();
            transaction.nonce = utils_1.BigNumber.make(buf.readUint64().toString());
        }
        transaction.senderPublicKey = buf.readBytes(33).toString("hex");
        transaction.fee = utils_1.BigNumber.make(buf.readUint64().toString());
        transaction.amount = utils_1.BigNumber.ZERO;
    }
    static deserializeVendorField(transaction, buf) {
        const vendorFieldLength = buf.readUint8();
        if (vendorFieldLength > 0) {
            if (transaction.hasVendorField()) {
                const vendorFieldBuffer = buf.readBytes(vendorFieldLength).toBuffer();
                transaction.data.vendorField = vendorFieldBuffer.toString("utf8");
            }
            else {
                buf.skip(vendorFieldLength);
            }
        }
    }
    static deserializeSignatures(transaction, buf) {
        if (transaction.version === 1) {
            this.deserializeECDSA(transaction, buf);
        }
        else {
            this.deserializeSchnorrOrECDSA(transaction, buf);
        }
    }
    static deserializeSchnorrOrECDSA(transaction, buf) {
        if (this.detectSchnorr(buf)) {
            this.deserializeSchnorr(transaction, buf);
        }
        else {
            this.deserializeECDSA(transaction, buf);
        }
    }
    static deserializeECDSA(transaction, buf) {
        const currentSignatureLength = () => {
            buf.mark();
            const lengthHex = buf
                .skip(1)
                .readBytes(1)
                .toString("hex");
            buf.reset();
            return parseInt(lengthHex, 16) + 2;
        };
        // Signature
        if (buf.remaining()) {
            const signatureLength = currentSignatureLength();
            transaction.signature = buf.readBytes(signatureLength).toString("hex");
        }
        const beginningMultiSignature = () => {
            buf.mark();
            const marker = buf.readUint8();
            buf.reset();
            return marker === 255;
        };
        // Second Signature
        if (buf.remaining() && !beginningMultiSignature()) {
            const secondSignatureLength = currentSignatureLength();
            transaction.secondSignature = buf.readBytes(secondSignatureLength).toString("hex");
        }
        // Multi Signatures
        if (buf.remaining() && beginningMultiSignature()) {
            buf.skip(1);
            const multiSignature = buf.readBytes(buf.limit - buf.offset).toString("hex");
            transaction.signatures = [multiSignature];
        }
        if (buf.remaining()) {
            throw new errors_1.InvalidTransactionBytesError("signature buffer not exhausted");
        }
    }
    static deserializeSchnorr(transaction, buf) {
        const canReadNonMultiSignature = () => {
            return buf.remaining() && (buf.remaining() % 64 === 0 || buf.remaining() % 65 !== 0);
        };
        if (canReadNonMultiSignature()) {
            transaction.signature = buf.readBytes(64).toString("hex");
        }
        if (canReadNonMultiSignature()) {
            transaction.secondSignature = buf.readBytes(64).toString("hex");
        }
        if (buf.remaining()) {
            if (buf.remaining() % 65 === 0) {
                transaction.signatures = [];
                const count = buf.remaining() / 65;
                const publicKeyIndexes = {};
                for (let i = 0; i < count; i++) {
                    const multiSignaturePart = buf.readBytes(65).toString("hex");
                    const publicKeyIndex = parseInt(multiSignaturePart.slice(0, 2), 16);
                    if (!publicKeyIndexes[publicKeyIndex]) {
                        publicKeyIndexes[publicKeyIndex] = true;
                    }
                    else {
                        throw new errors_1.DuplicateParticipantInMultiSignatureError();
                    }
                    transaction.signatures.push(multiSignaturePart);
                }
            }
            else {
                throw new errors_1.InvalidTransactionBytesError("signature buffer not exhausted");
            }
        }
    }
    static detectSchnorr(buf) {
        const remaining = buf.remaining();
        // `signature` / `secondSignature`
        if (remaining === 64 || remaining === 128) {
            return true;
        }
        // `signatures` of a multi signature transaction (type != 4)
        if (remaining % 65 === 0) {
            return true;
        }
        // only possiblity left is a type 4 transaction with and without a `secondSignature`.
        if ((remaining - 64) % 65 === 0 || (remaining - 128) % 65 === 0) {
            return true;
        }
        return false;
    }
    // tslint:disable-next-line:member-ordering
    static applyV1Compatibility(transaction) {
        transaction.secondSignature = transaction.secondSignature || transaction.signSignature;
        transaction.typeGroup = enums_1.TransactionTypeGroup.Core;
        if (transaction.type === enums_1.TransactionType.Vote) {
            transaction.recipientId = identities_1.Address.fromPublicKey(transaction.senderPublicKey, transaction.network);
        }
        else if (transaction.type === enums_1.TransactionType.MultiSignature) {
            transaction.asset.multiSignatureLegacy.keysgroup = transaction.asset.multiSignatureLegacy.keysgroup.map(k => k.startsWith("+") ? k : `+${k}`);
        }
    }
    static getByteBuffer(serialized) {
        if (!(serialized instanceof Buffer)) {
            serialized = Buffer.from(serialized, "hex");
        }
        const buffer = new bytebuffer_1.default(serialized.length, true);
        buffer.append(serialized);
        buffer.reset();
        return buffer;
    }
}
exports.Deserializer = Deserializer;
//# sourceMappingURL=deserializer.js.map