/**
 * @type {Object}
 */
export const schema = {
    getStatus: {
        type: "object",
        properties: {
            success: {
                type: "boolean",
            },
            height: {
                type: "integer",
                minimum: 0,
            },
            currentSlot: {
                type: "integer",
                minimum: 0,
            },
            forgingAllowed: {
                type: "boolean",
            },
            header: {
                type: "object",
            },
        },
        required: ["success", "height", "header", "currentSlot", "forgingAllowed"],
    },
    getHeight: {
        type: "object",
        properties: {
            success: {
                type: "boolean",
            },
            height: {
                type: "integer",
                minimum: 0,
            },
            header: {
                type: "object",
            },
        },
        required: ["success", "height", "header"],
    },
    postTransactions: {
        type: "object",
        required: ["transactions"],
        additionalProperties: false,
        properties: {
            transactions: { $ref: "transactions", minItems: 1, maxItems: 40 }, // TODO: use config
        },
    },
    getTransactions: {
        type: "object",
        properties: {
            success: {
                type: "boolean",
            },
            transactions: {
                type: "array",
                uniqueItems: true,
            },
        },
        required: ["transactions"],
    },
    getBlocks: {
        type: "object",
        properties: {
            success: {
                type: "boolean",
            },
            blocks: {
                type: "array",
            },
        },
        required: ["blocks"],
    },
    postBlock: {
        $ref: "block",
    },
    getBlock: {
        type: "object",
    },
    getCommonBlocks: {
        type: "object",
    },
    getPeers: {
        type: "object",
        properties: {
            success: {
                type: "boolean",
            },
            peers: {
                type: "array",
            },
        },
        required: ["peers"],
    },
};
