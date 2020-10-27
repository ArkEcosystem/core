export const getPeers = {
    request: {
        serialize: (obj): Buffer => Buffer.from(JSON.stringify(obj)),
        deserialize: (payload: Buffer) => JSON.parse(payload.toString()),
    },
    response: {
        serialize: (obj): Buffer => Buffer.from(JSON.stringify(obj)),
        deserialize: (payload: Buffer) => JSON.parse(payload.toString()),
    },
};

export const getCommonBlocks = {
    request: {
        serialize: (obj): Buffer => Buffer.from(JSON.stringify(obj)),
        deserialize: (payload: Buffer) => JSON.parse(payload.toString()),
    },
    response: {
        serialize: (obj): Buffer => Buffer.from(JSON.stringify(obj)),
        deserialize: (payload: Buffer) => JSON.parse(payload.toString()),
    },
};

export const getStatus = {
    request: {
        serialize: (obj): Buffer => Buffer.from(JSON.stringify(obj)),
        deserialize: (payload: Buffer) => JSON.parse(payload.toString()),
    },
    response: {
        serialize: (obj): Buffer => Buffer.from(JSON.stringify(obj)),
        deserialize: (payload: Buffer) => JSON.parse(payload.toString()),
    },
}