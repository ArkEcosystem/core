export const getBalance: object = {
    type: "object",
    properties: {
        address: {
            type: "string",
            minLength: 1,
            format: "address",
        },
    },
    required: ["address"],
};

export const getPublicKey: object = {
    type: "object",
    properties: {
        address: {
            type: "string",
            minLength: 1,
            format: "address",
        },
    },
    required: ["address"],
};

export const generatePublicKey: object = {
    type: "object",
    properties: {
        secret: {
            type: "string",
            minLength: 1,
        },
    },
    required: ["secret"],
};

export const getDelegates: object = {
    type: "object",
    properties: {
        address: {
            type: "string",
            minLength: 1,
            format: "address",
        },
    },
    required: ["address"],
};

export const getAccount: object = {
    type: "object",
    properties: {
        address: {
            type: "string",
            minLength: 1,
            format: "address",
        },
    },
    required: ["address"],
};

export const top: object = {
    type: "object",
    properties: {
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
