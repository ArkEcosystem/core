import { transactions } from "./proto/protos";

// actual max transactions is enforced by schema but we set a hard limit for deserializing (way higher than in schema)
const hardLimitNumberOfTransactions = 1000;

export const postTransactions = {
    request: {
        serialize: (obj): Buffer => {
            const objShallowClone = { ...obj };
            objShallowClone.transactions = objShallowClone.transactions.reduce(
                (acc, curr) => {
                    const txByteLength = Buffer.alloc(4);
                    txByteLength.writeUInt32BE(curr.byteLength);
                    return Buffer.concat([acc, txByteLength, curr]);
                },
                Buffer.alloc(0)
            );
            return Buffer.from(transactions.PostTransactionsRequest.encode(objShallowClone).finish());
        },
        deserialize: (payload: Buffer) => {
            const decoded = transactions.PostTransactionsRequest.decode(payload);
            const txsBuffer = Buffer.from(decoded.transactions);
            const txs: Buffer[] = [];
            for (let offset = 0; offset < (txsBuffer.byteLength - 4);) {
                const txLength = txsBuffer.readUInt32BE(offset);
                txs.push(txsBuffer.slice(offset + 4, offset + 4 + txLength));
                offset += 4 + txLength;
                if (txs.length > hardLimitNumberOfTransactions) { break; }
            }

            return {
                ...decoded,
                transactions: txs,
            };
        },
    },
    response: {
        serialize: (accept: string[]): Buffer => Buffer.from(transactions.PostTransactionsResponse.encode({ accept }).finish()),
        deserialize: (payload: Buffer) => transactions.PostTransactionsResponse.decode(payload).accept,
    },
}