import { Bignum, models, Transaction } from "@arkecosystem/crypto";
import msgpack from "msgpack-lite";
import { camelizeKeys, decamelizeKeys } from "xcase";
const { Block } = models;

export const blockEncode = blockRecord => {
    const data = camelizeKeys(blockRecord);
    return Block.serialize(data, true);
};

export const blockDecode = bufferData => {
    const blockData = Block.deserialize(bufferData.toString("hex"), true);

    blockData.totalAmount = (blockData.totalAmount as Bignum).toFixed();
    blockData.totalFee = (blockData.totalFee as Bignum).toFixed();
    blockData.reward = (blockData.reward as Bignum).toFixed();

    return decamelizeKeys(blockData);
};

export const transactionEncode = transaction =>
    msgpack.encode([transaction.id, transaction.block_id, transaction.sequence, transaction.serialized]);

export const transactionDecode = bufferData => {
    const [id, blockId, sequence, serialized] = msgpack.decode(bufferData);
    let transaction: any = Transaction.fromBytes(serialized).data;

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
