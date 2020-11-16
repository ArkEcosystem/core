import { transactions } from "./proto/protos";

export const postTransactions = {
    request: {
        serialize: (obj): Buffer => Buffer.from(transactions.PostTransactionsRequest.encode(obj).finish()),
        deserialize: (payload: Buffer) => {
            return {
                transactions: transactions.PostTransactionsRequest.decode(payload).transactions.map(t => Buffer.from(t))
            }
        },
    },
    response: {
        serialize: (accept: string[]): Buffer => Buffer.from(transactions.PostTransactionsResponse.encode({ accept }).finish()),
        deserialize: (payload: Buffer) => transactions.PostTransactionsResponse.decode(payload).accept,
    },
}