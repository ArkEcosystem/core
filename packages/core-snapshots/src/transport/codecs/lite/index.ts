import msgpack from "msgpack-lite";
import { columns } from "../../../db/utils/column-set";

export const blockEncode = block => {
    const values = Object.values(block);
    return msgpack.encode(values);
};

export const blockDecode = bufferData => {
    const values = msgpack.decode(bufferData);
    const block = {};
    columns.blocks.forEach((column, i) => {
        block[column] = values[i];
    });
    return block;
};

export const transactionEncode = transactionRecord => {
    const values = Object.values(transactionRecord);
    return msgpack.encode(values);
};

export const transactionDecode = bufferData => {
    const values = msgpack.decode(bufferData);
    const transaction = {};
    columns.transactions.forEach((column, i) => {
        transaction[column] = values[i];
    });
    return transaction;
};
