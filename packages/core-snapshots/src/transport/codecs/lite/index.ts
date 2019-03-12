import msgpack from "msgpack-lite";
import { columns } from "../../../db/utils/column-set";

export const blockEncode = block => {
    return msgpack.encode(Object.values(block));
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
    return msgpack.encode(Object.values(transactionRecord));
};

export const transactionDecode = bufferData => {
    const values = msgpack.decode(bufferData);
    const transaction = {};
    columns.transactions.forEach((column, i) => {
        transaction[column] = values[i];
    });
    return transaction;
};
