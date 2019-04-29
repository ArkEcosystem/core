import { Bignum, models, Transaction } from "@arkecosystem/crypto";
import { createCodec, decode, encode } from "msgpack-lite";
import { camelizeKeys, decamelizeKeys } from "xcase";

function encodeBlock(block) {
    return models.Block.serialize(camelizeKeys(block), true);
}

function decodeBlock(buffer: Buffer) {
    const block = models.Block.deserialize(buffer.toString("hex"), true);
    block.totalAmount = (block.totalAmount as Bignum).toFixed();
    block.totalFee = (block.totalFee as Bignum).toFixed();
    block.reward = (block.reward as Bignum).toFixed();

    return decamelizeKeys(block);
}

function encodeTransaction(transaction) {
    transaction.blockId = transaction.block_id || transaction.blockId;

    return encode([
        transaction.id,
        transaction.blockId,
        transaction.sequence,
        transaction.timestamp,
        transaction.serialized,
    ]);
}

function decodeTransaction(buffer: Buffer) {
    const [id, blockId, sequence, timestamp, serialized] = decode(buffer);

    const transaction: any = Transaction.fromBytesUnsafe(serialized, id).data;
    const { asset } = transaction;
    transaction.asset = null;

    transaction.block_id = blockId;
    transaction.sequence = sequence;
    transaction.timestamp = timestamp;
    transaction.amount = transaction.amount.toFixed();
    transaction.fee = transaction.fee.toFixed();
    transaction.vendorFieldHex = transaction.vendorFieldHex ? transaction.vendorFieldHex : null;
    transaction.recipientId = transaction.recipientId ? transaction.recipientId : null;
    transaction.serialized = serialized;

    const decamelized = decamelizeKeys(transaction);
    decamelized.serialized = serialized; // FIXME: decamelizeKeys mutilates Buffers
    decamelized.asset = asset ? asset : null;

    return decamelized;
}

function encodeRound(round) {
    return encode([round.id, round.public_key || round.publicKey, round.balance, round.round]);
}

function decodeRound(buffer: Buffer) {
    const [id, publicKey, balance, round] = decode(buffer);

    return decamelizeKeys({
        id,
        publicKey,
        balance,
        round,
    });
}

export class Codec {
    static get blocks() {
        const codec = createCodec();
        codec.addExtPacker(0x3f, Object, encodeBlock);
        codec.addExtUnpacker(0x3f, decodeBlock);

        return codec;
    }

    static get transactions() {
        const codec = createCodec();
        codec.addExtPacker(0x4f, Object, encodeTransaction);
        codec.addExtUnpacker(0x4f, decodeTransaction);

        return codec;
    }

    static get rounds() {
        const codec = createCodec();
        codec.addExtPacker(0x5f, Object, encodeRound);
        codec.addExtUnpacker(0x5f, decodeRound);

        return codec;
    }
}
