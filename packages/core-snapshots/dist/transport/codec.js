"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const msgpack_lite_1 = require("msgpack-lite");
const xcase_1 = require("xcase");
const encodeBlock = block => {
    const blockCamelized = xcase_1.camelizeKeys(block);
    blockCamelized.totalAmount = crypto_1.Utils.BigNumber.make(block.total_amount || block.totalAmount);
    blockCamelized.totalFee = crypto_1.Utils.BigNumber.make(block.total_fee || block.totalFee);
    blockCamelized.reward = crypto_1.Utils.BigNumber.make(block.reward);
    return crypto_1.Blocks.Block.serialize(blockCamelized, true);
};
const decodeBlock = (buffer) => {
    const block = crypto_1.Blocks.Block.deserialize(buffer.toString("hex"), true);
    // @ts-ignore - @TODO: remove ts-ignore
    block.totalAmount = block.totalAmount.toFixed();
    // @ts-ignore - @TODO: remove ts-ignore
    block.totalFee = block.totalFee.toFixed();
    // @ts-ignore - @TODO: remove ts-ignore
    block.reward = block.reward.toFixed();
    return xcase_1.decamelizeKeys(block);
};
const encodeTransaction = transaction => {
    transaction.blockId = transaction.block_id || transaction.blockId;
    return msgpack_lite_1.encode([
        transaction.id,
        transaction.blockId,
        transaction.sequence,
        transaction.timestamp,
        transaction.serialized,
    ]);
};
const decodeTransaction = (buffer) => {
    const [id, blockId, sequence, timestamp, serialized] = msgpack_lite_1.decode(buffer);
    const transaction = crypto_1.Transactions.TransactionFactory.fromBytesUnsafe(serialized, id).data;
    const { asset } = transaction;
    transaction.asset = undefined;
    transaction.block_id = blockId;
    transaction.sequence = sequence;
    if (transaction.version === 1) {
        transaction.nonce = "0"; // Will be set correctly at database level by an INSERT trigger
    }
    else {
        transaction.nonce = transaction.nonce.toFixed();
    }
    transaction.timestamp = timestamp;
    transaction.amount = transaction.amount.toFixed();
    transaction.fee = transaction.fee.toFixed();
    transaction.vendorField = transaction.vendorField ? transaction.vendorField : undefined;
    transaction.recipientId = transaction.recipientId ? transaction.recipientId : undefined;
    transaction.serialized = serialized;
    const decamelized = xcase_1.decamelizeKeys(transaction);
    decamelized.serialized = serialized; // FIXME: decamelizeKeys mutilates Buffers
    decamelized.asset = asset ? asset : undefined;
    return decamelized;
};
const encodeRound = round => {
    return msgpack_lite_1.encode([round.public_key || round.publicKey, round.balance, round.round]);
};
const decodeRound = (buffer) => {
    const [publicKey, balance, round] = msgpack_lite_1.decode(buffer);
    return xcase_1.decamelizeKeys({
        publicKey,
        balance,
        round,
    });
};
class Codec {
    static get blocks() {
        const codec = msgpack_lite_1.createCodec();
        codec.addExtPacker(0x3f, Object, encodeBlock);
        codec.addExtUnpacker(0x3f, decodeBlock);
        return codec;
    }
    static get transactions() {
        const codec = msgpack_lite_1.createCodec();
        codec.addExtPacker(0x4f, Object, encodeTransaction);
        codec.addExtUnpacker(0x4f, decodeTransaction);
        return codec;
    }
    static get rounds() {
        const codec = msgpack_lite_1.createCodec();
        codec.addExtPacker(0x5f, Object, encodeRound);
        codec.addExtUnpacker(0x5f, decodeRound);
        return codec;
    }
}
exports.Codec = Codec;
//# sourceMappingURL=codec.js.map