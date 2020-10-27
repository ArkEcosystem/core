export const getBlocks = {
    request: {
        serialize: (obj): Buffer => Buffer.from(JSON.stringify(obj)),
        deserialize: (payload: Buffer) => JSON.parse(payload.toString()),
    },
    response: {
        serialize: (obj): Buffer => Buffer.from(JSON.stringify(obj)),
        deserialize: (payload: Buffer) => JSON.parse(payload.toString()),
    },
};

export const postBlock = {
    request: {
        serialize: (obj): Buffer => Buffer.from(JSON.stringify(obj)),
        deserialize: (payload: Buffer) => JSON.parse(payload.toString()),
    },
    response: {
        serialize: (status: boolean): Buffer => {
            const buf = Buffer.alloc(1);
            buf.writeUInt8(status ? 1 : 0);
            return buf;
        },
        deserialize: (payload: Buffer): boolean => !!payload.readUInt8(),
    },
};
