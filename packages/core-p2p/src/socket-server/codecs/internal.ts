export const emitEvent = {
    request: {
        serialize: (obj): Buffer => Buffer.from(JSON.stringify(obj)),
        deserialize: (payload: Buffer) => JSON.parse(payload.toString()),
    },
    response: {
        serialize: (obj): Buffer => Buffer.from(JSON.stringify(obj)),
        deserialize: (payload: Buffer) => JSON.parse(payload.toString()),
    },
};

export const getUnconfirmedTransactions = {
    request: {
        serialize: (obj): Buffer => Buffer.from(JSON.stringify(obj)),
        deserialize: (payload: Buffer) => JSON.parse(payload.toString()),
    },
    response: {
        serialize: (obj): Buffer => Buffer.from(JSON.stringify(obj)),
        deserialize: (payload: Buffer) => JSON.parse(payload.toString()),
    },
};

export const getCurrentRound = {
    request: {
        serialize: (obj): Buffer => Buffer.from(JSON.stringify(obj)),
        deserialize: (payload: Buffer) => JSON.parse(payload.toString()),
    },
    response: {
        serialize: (obj): Buffer => Buffer.from(JSON.stringify(obj)),
        deserialize: (payload: Buffer) => JSON.parse(payload.toString()),
    },
};

export const getNetworkState = {
    request: {
        serialize: (obj): Buffer => Buffer.from(JSON.stringify(obj)),
        deserialize: (payload: Buffer) => JSON.parse(payload.toString()),
    },
    response: {
        serialize: (obj): Buffer => Buffer.from(JSON.stringify(obj)),
        deserialize: (payload: Buffer) => JSON.parse(payload.toString()),
    },
};

export const syncBlockchain = {
    request: {
        serialize: (obj): Buffer => Buffer.from(JSON.stringify(obj)),
        deserialize: (payload: Buffer) => JSON.parse(payload.toString()),
    },
    response: {
        serialize: (obj): Buffer => Buffer.from(JSON.stringify(obj)),
        deserialize: (payload: Buffer) => JSON.parse(payload.toString()),
    },
};
