"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bytebuffer_1 = __importDefault(require("bytebuffer"));
const managers_1 = require("../managers");
const transactions_1 = require("../transactions");
const utils_1 = require("../utils");
const block_1 = require("./block");
class Deserializer {
    static deserialize(serializedHex, headerOnly = false, options = {}) {
        const block = {};
        let transactions = [];
        const buffer = Buffer.from(serializedHex, "hex");
        const buf = new bytebuffer_1.default(buffer.length, true);
        buf.append(buffer);
        buf.reset();
        this.deserializeHeader(block, buf);
        headerOnly = headerOnly || buf.remaining() === 0;
        if (!headerOnly) {
            transactions = this.deserializeTransactions(block, buf, options.deserializeTransactionsUnchecked);
        }
        block.idHex = block_1.Block.getIdHex(block);
        block.id = block_1.Block.getId(block);
        const { outlookTable } = managers_1.configManager.get("exceptions");
        if (outlookTable && outlookTable[block.id]) {
            const constants = managers_1.configManager.getMilestone(block.height);
            if (constants.block.idFullSha256) {
                block.id = outlookTable[block.id];
                block.idHex = block.id;
            }
            else {
                block.id = outlookTable[block.id];
                block.idHex = block_1.Block.toBytesHex(block.id);
            }
        }
        return { data: block, transactions };
    }
    static deserializeHeader(block, buf) {
        block.version = buf.readUint32();
        block.timestamp = buf.readUint32();
        block.height = buf.readUint32();
        const constants = managers_1.configManager.getMilestone(block.height - 1 || 1);
        if (constants.block.idFullSha256) {
            block.previousBlockHex = buf.readBytes(32).toString("hex");
            block.previousBlock = block.previousBlockHex;
        }
        else {
            block.previousBlockHex = buf.readBytes(8).toString("hex");
            block.previousBlock = utils_1.BigNumber.make(`0x${block.previousBlockHex}`).toString();
        }
        block.numberOfTransactions = buf.readUint32();
        block.totalAmount = utils_1.BigNumber.make(buf.readUint64().toString());
        block.totalFee = utils_1.BigNumber.make(buf.readUint64().toString());
        block.reward = utils_1.BigNumber.make(buf.readUint64().toString());
        block.payloadLength = buf.readUint32();
        block.payloadHash = buf.readBytes(32).toString("hex");
        block.generatorPublicKey = buf.readBytes(33).toString("hex");
        const signatureLength = () => {
            buf.mark();
            const lengthHex = buf
                .skip(1)
                .readBytes(1)
                .toString("hex");
            buf.reset();
            return parseInt(lengthHex, 16) + 2;
        };
        block.blockSignature = buf.readBytes(signatureLength()).toString("hex");
    }
    static deserializeTransactions(block, buf, deserializeTransactionsUnchecked = false) {
        const transactionLengths = [];
        for (let i = 0; i < block.numberOfTransactions; i++) {
            transactionLengths.push(buf.readUint32());
        }
        const transactions = [];
        block.transactions = [];
        for (const length of transactionLengths) {
            const transactionBytes = buf.readBytes(length).toBuffer();
            const transaction = deserializeTransactionsUnchecked
                ? transactions_1.TransactionFactory.fromBytesUnsafe(transactionBytes)
                : transactions_1.TransactionFactory.fromBytes(transactionBytes);
            transactions.push(transaction);
            block.transactions.push(transaction.data);
        }
        return transactions;
    }
}
exports.Deserializer = Deserializer;
//# sourceMappingURL=deserializer.js.map