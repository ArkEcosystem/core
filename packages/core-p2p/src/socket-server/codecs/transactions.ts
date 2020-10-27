export const postTransactions = {
    request: {
        serialize: (obj): Buffer => Buffer.from(JSON.stringify(obj)),
        deserialize: (payload: Buffer) => JSON.parse(payload.toString()),
    },
    response: {
        serialize: (obj): Buffer => Buffer.from(JSON.stringify(obj)),
        deserialize: (payload: Buffer) => JSON.parse(payload.toString()),
    },
}