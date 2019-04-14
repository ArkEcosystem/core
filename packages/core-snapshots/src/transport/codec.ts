import { Blocks, Transactions, Utils } from "@arkecosystem/crypto";
import { createCodec, decode, encode } from "msgpack-lite";
import { camelizeKeys, decamelizeKeys } from "xcase";

function encodeBlock(block) {
    return Blocks.Block.serialize(camelizeKeys(block), true);
}

function decodeBlock(buffer) {
    const block = Blocks.Block.deserialize(buffer.toString("hex"), true);
    // @ts-ignore
    block.totalAmount = (block.totalAmount as Utils.BigNumber).toFixed();
    // @ts-ignore
    block.totalFee = (block.totalFee as Utils.BigNumber).toFixed();
    // @ts-ignore
    block.reward = (block.reward as Utils.BigNumber).toFixed();

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

function decodeTransaction(buffer) {
    const [id, blockId, sequence, timestamp, serialized] = decode(buffer);

    const transaction: any = Transactions.Transaction.fromBytesUnsafe(serialized, id).data;
    transaction.block_id = blockId;
    transaction.sequence = sequence;
    transaction.timestamp = timestamp;
    transaction.amount = transaction.amount.toFixed();
    transaction.fee = transaction.fee.toFixed();
    transaction.vendorFieldHex = transaction.vendorFieldHex ? transaction.vendorFieldHex : null;
    transaction.recipientId = transaction.recipientId ? transaction.recipientId : null;
    transaction.asset = transaction.asset ? transaction.asset : null;
    transaction.serialized = serialized;

    const decamelized = decamelizeKeys(transaction);
    decamelized.serialized = serialized; // FIXME: decamelizeKeys mutilates Buffers
    return decamelized;
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
}
