import { transactions } from "./proto/protos";

// actual max transactions is enforced by schema but we set a hard limit for deserializing (way higher than in schema)
const hardLimitNumberOfTransactions = 1000;

export const postTransactions = {
    request: {
        serialize: (obj): Buffer => {
            const size = obj.transactions.reduce((sum: number, tx: Buffer) => sum + 4 + tx.length, 0);
            const result = Buffer.alloc(size);

            let offset = 0;
            for (const tx of obj.transactions as Buffer[]) {
                offset = result.writeUInt32BE(tx.length, offset);
                offset += tx.copy(result, offset);
            }

            obj = { ...obj, transactions: result };

            return Buffer.from(transactions.PostTransactionsRequest.encode(obj).finish());
        },
        deserialize: (payload: Buffer) => {
            const decoded = transactions.PostTransactionsRequest.decode(payload);
            const txsBuffer = Buffer.from(decoded.transactions);
            const txs: Buffer[] = [];
            for (let offset = 0; offset < txsBuffer.byteLength - 4; ) {
                const txLength = txsBuffer.readUInt32BE(offset);
                txs.push(txsBuffer.slice(offset + 4, offset + 4 + txLength));
                offset += 4 + txLength;
                if (txs.length > hardLimitNumberOfTransactions) {
                    break;
                }
            }

            return {
                ...decoded,
                transactions: txs,
            };
        },
    },
    response: {
        serialize: (accept: string[]): Buffer =>
            Buffer.from(transactions.PostTransactionsResponse.encode({ accept }).finish()),
        deserialize: (payload: Buffer) => transactions.PostTransactionsResponse.decode(payload).accept,
    },
};
