"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* tslint:disable:no-shadowed-variable */
const bytebuffer_1 = __importDefault(require("bytebuffer"));
const __1 = require("..");
const enums_1 = require("../enums");
const errors_1 = require("../errors");
const identities_1 = require("../identities");
const config_1 = require("../managers/config");
const utils_1 = require("../utils");
const types_1 = require("./types");
// Reference: https://github.com/ArkEcosystem/AIPs/blob/master/AIPS/aip-11.md
class Serializer {
    static getBytes(transaction, options = {}) {
        const version = transaction.version || 1;
        if (options.acceptLegacyVersion || utils_1.isSupportedTransactionVersion(version)) {
            if (version === 1) {
                return this.getBytesV1(transaction, options);
            }
            else {
                return this.serialize(types_1.TransactionTypeFactory.create(transaction), options);
            }
        }
        else {
            throw new errors_1.TransactionVersionError(version);
        }
    }
    /**
     * Serializes the given transaction according to AIP11.
     */
    static serialize(transaction, options = {}) {
        const buffer = new bytebuffer_1.default(512, true);
        this.serializeCommon(transaction.data, buffer);
        this.serializeVendorField(transaction, buffer);
        const typeBuffer = transaction.serialize(options).flip();
        buffer.append(typeBuffer);
        this.serializeSignatures(transaction.data, buffer, options);
        const flippedBuffer = buffer.flip().toBuffer();
        transaction.serialized = flippedBuffer;
        return flippedBuffer;
    }
    /**
     * Serializes the given transaction prior to AIP11 (legacy).
     */
    static getBytesV1(transaction, options = {}) {
        let assetSize = 0;
        let assetBytes;
        switch (transaction.type) {
            case enums_1.TransactionType.SecondSignature: {
                const { signature } = transaction.asset;
                const bb = new bytebuffer_1.default(33, true);
                const publicKeyBuffer = Buffer.from(signature.publicKey, "hex");
                for (const byte of publicKeyBuffer) {
                    bb.writeByte(byte);
                }
                bb.flip();
                assetBytes = new Uint8Array(bb.toArrayBuffer());
                assetSize = assetBytes.length;
                break;
            }
            case enums_1.TransactionType.DelegateRegistration: {
                assetBytes = Buffer.from(transaction.asset.delegate.username, "utf8");
                assetSize = assetBytes.length;
                break;
            }
            case enums_1.TransactionType.Vote: {
                if (transaction.asset.votes) {
                    assetBytes = Buffer.from(transaction.asset.votes.join(""), "utf8");
                    assetSize = assetBytes.length;
                }
                break;
            }
            case enums_1.TransactionType.MultiSignature: {
                const keysgroupBuffer = Buffer.from(transaction.asset.multiSignatureLegacy.keysgroup.join(""), "utf8");
                const bb = new bytebuffer_1.default(1 + 1 + keysgroupBuffer.length, true);
                bb.writeByte(transaction.asset.multiSignatureLegacy.min);
                bb.writeByte(transaction.asset.multiSignatureLegacy.lifetime);
                for (const byte of keysgroupBuffer) {
                    bb.writeByte(byte);
                }
                bb.flip();
                assetBytes = bb.toBuffer();
                assetSize = assetBytes.length;
                break;
            }
        }
        const bb = new bytebuffer_1.default(1 + 4 + 32 + 8 + 8 + 21 + 64 + 64 + 64 + assetSize, true);
        bb.writeByte(transaction.type);
        bb.writeInt(transaction.timestamp);
        const senderPublicKeyBuffer = Buffer.from(transaction.senderPublicKey, "hex");
        for (const byte of senderPublicKeyBuffer) {
            bb.writeByte(byte);
        }
        // Apply fix for broken type 1 and 4 transactions, which were
        // erroneously calculated with a recipient id.
        const { transactionIdFixTable } = config_1.configManager.get("exceptions");
        const isBrokenTransaction = transactionIdFixTable && Object.values(transactionIdFixTable).includes(transaction.id);
        if (isBrokenTransaction || (transaction.recipientId && transaction.type !== 1 && transaction.type !== 4)) {
            const recipientId = transaction.recipientId || identities_1.Address.fromPublicKey(transaction.senderPublicKey, transaction.network);
            const recipient = identities_1.Address.toBuffer(recipientId).addressBuffer;
            for (const byte of recipient) {
                bb.writeByte(byte);
            }
        }
        else {
            for (let i = 0; i < 21; i++) {
                bb.writeByte(0);
            }
        }
        if (transaction.vendorField) {
            const vf = Buffer.from(transaction.vendorField);
            const fillstart = vf.length;
            for (let i = 0; i < fillstart; i++) {
                bb.writeByte(vf[i]);
            }
            for (let i = fillstart; i < 64; i++) {
                bb.writeByte(0);
            }
        }
        else {
            for (let i = 0; i < 64; i++) {
                bb.writeByte(0);
            }
        }
        // @ts-ignore - The ByteBuffer types say we can't use strings but the code actually handles them.
        bb.writeInt64(transaction.amount.toString());
        // @ts-ignore - The ByteBuffer types say we can't use strings but the code actually handles them.
        bb.writeInt64(transaction.fee.toString());
        if (assetSize > 0) {
            for (let i = 0; i < assetSize; i++) {
                bb.writeByte(assetBytes[i]);
            }
        }
        if (!options.excludeSignature && transaction.signature) {
            const signatureBuffer = Buffer.from(transaction.signature, "hex");
            for (const byte of signatureBuffer) {
                bb.writeByte(byte);
            }
        }
        if (!options.excludeSecondSignature && transaction.secondSignature) {
            const signSignatureBuffer = Buffer.from(transaction.secondSignature, "hex");
            for (const byte of signSignatureBuffer) {
                bb.writeByte(byte);
            }
        }
        bb.flip();
        const arrayBuffer = new Uint8Array(bb.toArrayBuffer());
        const buffer = [];
        for (let i = 0; i < arrayBuffer.length; i++) {
            buffer[i] = arrayBuffer[i];
        }
        return Buffer.from(buffer);
    }
    static serializeCommon(transaction, buffer) {
        transaction.version = transaction.version || 0x01;
        if (transaction.typeGroup === undefined) {
            transaction.typeGroup = enums_1.TransactionTypeGroup.Core;
        }
        buffer.writeByte(0xff);
        buffer.writeByte(transaction.version);
        buffer.writeByte(transaction.network || config_1.configManager.get("network.pubKeyHash"));
        if (transaction.version === 1) {
            buffer.writeByte(transaction.type);
            buffer.writeUint32(transaction.timestamp);
        }
        else {
            buffer.writeUint32(transaction.typeGroup);
            buffer.writeUint16(transaction.type);
            // @ts-ignore - The ByteBuffer types say we can't use strings but the code actually handles them.
            buffer.writeUint64(transaction.nonce.toString());
        }
        buffer.append(transaction.senderPublicKey, "hex");
        // @ts-ignore - The ByteBuffer types say we can't use strings but the code actually handles them.
        buffer.writeUint64(transaction.fee.toString());
    }
    static serializeVendorField(transaction, buffer) {
        if (transaction.hasVendorField()) {
            const { data } = transaction;
            if (data.vendorField) {
                const vf = Buffer.from(data.vendorField, "utf8");
                buffer.writeByte(vf.length);
                buffer.append(vf);
            }
            else {
                buffer.writeByte(0x00);
            }
        }
        else {
            buffer.writeByte(0x00);
        }
    }
    static serializeSignatures(transaction, buffer, options = {}) {
        if (transaction.signature && !options.excludeSignature) {
            buffer.append(transaction.signature, "hex");
        }
        const secondSignature = transaction.secondSignature || transaction.signSignature;
        if (secondSignature && !options.excludeSecondSignature) {
            buffer.append(secondSignature, "hex");
        }
        if (transaction.signatures) {
            if (transaction.version === 1 && __1.Utils.isException(transaction)) {
                buffer.append("ff", "hex"); // 0xff separator to signal start of multi-signature transactions
                buffer.append(transaction.signatures.join(""), "hex");
            }
            else if (!options.excludeMultiSignature) {
                buffer.append(transaction.signatures.join(""), "hex");
            }
        }
    }
}
exports.Serializer = Serializer;
//# sourceMappingURL=serializer.js.map