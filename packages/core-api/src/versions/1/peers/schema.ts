export const getPeers: object = {
    type: "object",
    properties: {
        port: {
            type: "integer",
            minimum: 1,
            maximum: 65535,
        },
        status: {
            type: "string",
            maxLength: 20,
        },
        os: {
            type: "string",
            maxLength: 64,
        },
        version: {
            type: "string",
            maxLength: 11,
        },
        orderBy: {
            type: "string",
        },
        limit: {
            type: "integer",
            minimum: 0,
            maximum: 100,
        },
        offset: {
            type: "integer",
            minimum: 0,
        },
    },
};

export const getPeer: object = {
    type: "object",
    properties: {
        ip: {
            type: "string",
            format: "ip",
        },
        port: {
            type: "integer",
            minimum: 0,
            maximum: 65535,
        },
    },
    required: ["ip", "port"],
};
