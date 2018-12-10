export const getBlock: object = {
    type: "object",
    properties: {
        id: {
            type: "string",
            minLength: 1,
        },
    },
    required: ["id"],
};

export const getBlocks: object = {
    type: "object",
    properties: {
        limit: {
            type: "integer",
            minimum: 0,
            maximum: 100,
        },
        orderBy: {
            type: "string",
        },
        offset: {
            type: "integer",
            minimum: 0,
        },
        generatorPublicKey: {
            type: "string",
            format: "publicKey",
        },
        totalAmount: {
            type: "integer",
            minimum: 0,
        },
        totalFee: {
            type: "integer",
            minimum: 0,
        },
        reward: {
            type: "integer",
            minimum: 0,
        },
        previousBlock: {
            type: "string",
        },
        height: {
            type: "integer",
        },
    },
};
