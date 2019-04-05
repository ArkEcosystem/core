import { app } from "@arkecosystem/core-container";
const transactionPool = app.resolveOptions("transaction-pool");

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
            transactions: {
                $ref: "transactions",
                minItems: 1,
                maxItems: transactionPool ? transactionPool.maxTransactionsPerRequest || 40 : 40,
            },
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
        type: "object",
        required: ["block"],
        additionalProperties: false,
        properties: {
            block: { $ref: "block" },
        },
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
