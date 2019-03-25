import { Bignum, models, Transaction } from "@arkecosystem/crypto";
import { createCodec, decode, encode } from "msgpack-lite";
import { camelizeKeys, decamelizeKeys } from "xcase";

class Codec {
    public blocks() {
        const codec = createCodec();
        codec.addExtPacker(0x3f, Object, this.encodeBlock);
        codec.addExtUnpacker(0x3f, this.decodeBlock);

        return codec;
    }

    public transactions() {
        const codec = createCodec();
        codec.addExtPacker(0x4f, Object, this.encodeTransaction);
        codec.addExtUnpacker(0x4f, this.decodeTransaction);

        return codec;
    }

    private encodeBlock(block) {
        return models.Block.serialize(camelizeKeys(block), true);
    }

    private decodeBlock(buffer) {
        const block = models.Block.deserialize(buffer.toString("hex"), true);
        block.totalAmount = (block.totalAmount as Bignum).toFixed();
        block.totalFee = (block.totalFee as Bignum).toFixed();
        block.reward = (block.reward as Bignum).toFixed();

        return decamelizeKeys(block);
    }

    private encodeTransaction(transaction) {
        return encode([transaction.id, transaction.block_id, transaction.sequence, transaction.serialized]);
    }

    private decodeTransaction(buffer) {
        const [id, blockId, sequence, serialized] = decode(buffer);

        const transaction: any = Transaction.fromBytes(serialized);
        transaction.id = id;
        transaction.block_id = blockId;
        transaction.sequence = sequence;
        transaction.amount = transaction.amount.toFixed();
        transaction.fee = transaction.fee.toFixed();
        transaction.vendorFieldHex = transaction.vendorFieldHex ? transaction.vendorFieldHex : null;
        transaction.recipientId = transaction.recipientId ? transaction.recipientId : null;
        transaction.asset = transaction.asset ? transaction.asset : null;
        transaction.serialized = serialized;

        return decamelizeKeys(transaction);
    }
}

export const codec = new Codec();
