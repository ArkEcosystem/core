export const getTransactions: object = {
    type: "object",
    properties: {
        blockId: {
            type: "string",
        },
        limit: {
            type: "integer",
            minimum: 0,
            maximum: 100,
        },
        type: {
            type: "integer",
            minimum: 0,
            maximum: 10,
        },
        orderBy: {
            type: "string",
        },
        offset: {
            type: "integer",
            minimum: 0,
        },
        senderPublicKey: {
            type: "string",
            format: "publicKey",
        },
        vendorField: {
            type: "string",
            format: "vendorField",
        },
        ownerPublicKey: {
            type: "string",
            format: "publicKey",
        },
        ownerAddress: {
            type: "string",
        },
        senderId: {
            type: "string",
            format: "address",
        },
        recipientId: {
            type: "string",
            format: "address",
        },
        amount: {
            type: "integer",
            minimum: 0,
            maximum: 10 ** 8,
        },
        fee: {
            type: "integer",
            minimum: 0,
            maximum: 10 ** 8,
        },
    },
};

export const getTransaction: object = {
    type: "object",
    properties: {
        id: {
            type: "string",
            minLength: 1,
        },
    },
    required: ["id"],
};

export const getUnconfirmedTransaction: object = {
    type: "object",
    properties: {
        id: {
            type: "string",
            minLength: 1,
        },
    },
    required: ["id"],
};

export const getUnconfirmedTransactions: object = {
    type: "object",
    properties: {
        senderPublicKey: {
            type: "string",
            format: "publicKey",
        },
        address: {
            type: "string",
        },
    },
};
