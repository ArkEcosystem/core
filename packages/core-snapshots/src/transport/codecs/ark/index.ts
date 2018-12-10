import { models } from "@arkecosystem/crypto";
import msgpack from "msgpack-lite";
import { camelizeKeys, decamelizeKeys } from "xcase";
const { Block, Transaction } = models;

export const blockEncode = blockRecord => {
    const data = camelizeKeys(blockRecord);
    return Block.serialize(data, true);
};

export const blockDecode = bufferData => {
    const blockData = Block.deserialize(bufferData.toString("hex"), true);
    blockData.id = Block.getIdFromSerialized(bufferData);

    blockData.totalAmount = blockData.totalAmount.toFixed();
    blockData.totalFee = blockData.totalFee.toFixed();
    blockData.reward = blockData.reward.toFixed();

    return decamelizeKeys(blockData);
};

export const transactionEncode = transaction =>
    msgpack.encode([transaction.id, transaction.block_id, transaction.sequence, transaction.serialized]);

export const transactionDecode = bufferData => {
    const [id, blockId, sequence, serialized] = msgpack.decode(bufferData);
    let transaction: any = {};
    transaction = Transaction.deserialize(serialized.toString("hex"));

    transaction.id = id;
    transaction.block_id = blockId;
    transaction.sequence = sequence;
    transaction.amount = transaction.amount.toFixed();
    transaction.fee = transaction.fee.toFixed();
    transaction.vendorFieldHex = transaction.vendorFieldHex ? transaction.vendorFieldHex : null;
    transaction.recipientId = transaction.recipientId ? transaction.recipientId : null;
    transaction = decamelizeKeys(transaction);

    transaction.serialized = serialized;
    return transaction;
};
