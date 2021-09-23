"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const bytebuffer_1 = __importDefault(require("bytebuffer"));
const errors_1 = require("../errors");
const config_1 = require("../managers/config");
const transactions_1 = require("../transactions");
const block_1 = require("./block");
class Serializer {
    static size(block) {
        let size = this.headerSize(block.data) + block.data.blockSignature.length / 2;
        for (const transaction of block.transactions) {
            size += 4 /* tx length */ + transaction.serialized.length;
        }
        return size;
    }
    static serializeWithTransactions(block) {
        const transactions = block.transactions || [];
        block.numberOfTransactions = block.numberOfTransactions || transactions.length;
        const serializedHeader = this.serialize(block);
        const buffer = new bytebuffer_1.default(serializedHeader.length + transactions.length * 4, true)
            .append(serializedHeader)
            .skip(transactions.length * 4);
        for (let i = 0; i < transactions.length; i++) {
            const serialized = transactions_1.Utils.toBytes(transactions[i]);
            buffer.writeUint32(serialized.length, serializedHeader.length + i * 4);
            buffer.append(serialized);
        }
        return buffer.flip().toBuffer();
    }
    static serialize(block, includeSignature = true) {
        const buffer = new bytebuffer_1.default(512, true);
        this.serializeHeader(block, buffer);
        if (includeSignature) {
            this.serializeSignature(block, buffer);
        }
        return buffer.flip().toBuffer();
    }
    static headerSize(block) {
        const constants = config_1.configManager.getMilestone(block.height - 1 || 1);
        return 4 + // version
            4 + // timestamp
            4 + // height
            (constants.block.idFullSha256 ? 32 : 8) + // previousBlock
            4 + // numberOfTransactions
            8 + // totalAmount
            8 + // totalFee
            8 + // reward
            4 + // payloadLength
            block.payloadHash.length / 2 +
            block.generatorPublicKey.length / 2;
    }
    static serializeHeader(block, buffer) {
        const constants = config_1.configManager.getMilestone(block.height - 1 || 1);
        if (constants.block.idFullSha256) {
            if (block.previousBlock.length !== 64) {
                throw new errors_1.PreviousBlockIdFormatError(block.height, block.previousBlock);
            }
            block.previousBlockHex = block.previousBlock;
        }
        else {
            block.previousBlockHex = block_1.Block.toBytesHex(block.previousBlock);
        }
        buffer.writeUint32(block.version);
        buffer.writeUint32(block.timestamp);
        buffer.writeUint32(block.height);
        buffer.append(block.previousBlockHex, "hex");
        buffer.writeUint32(block.numberOfTransactions);
        // @ts-ignore - The ByteBuffer types say we can't use strings but the code actually handles them.
        buffer.writeUint64(block.totalAmount.toString());
        // @ts-ignore - The ByteBuffer types say we can't use strings but the code actually handles them.
        buffer.writeUint64(block.totalFee.toString());
        // @ts-ignore - The ByteBuffer types say we can't use strings but the code actually handles them.
        buffer.writeUint64(block.reward.toString());
        buffer.writeUint32(block.payloadLength);
        buffer.append(block.payloadHash, "hex");
        buffer.append(block.generatorPublicKey, "hex");
        assert_1.default.strictEqual(buffer.offset, this.headerSize(block));
    }
    static serializeSignature(block, buffer) {
        if (block.blockSignature) {
            buffer.append(block.blockSignature, "hex");
        }
    }
}
exports.Serializer = Serializer;
//# sourceMappingURL=serializer.js.map