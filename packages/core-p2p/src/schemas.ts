import { app } from "@arkecosystem/core-container";

export const requestSchemas = {
    peer: {
        getCommonBlocks: {
            type: "object",
            required: ["ids"],
            additionalProperties: false,
            properties: {
                ids: { type: "array", additionalItems: false, minItems: 1, maxItems: 10, items: { blockId: {} } },
            },
        },
        getBlocks: {
            type: "object",
            required: ["lastBlockHeight"],
            additionalProperties: false,
            properties: {
                lastBlockHeight: { type: "integer", minimum: 1 },
                blockLimit: { type: "integer", minimum: 1, maximum: 400 },
                headersOnly: { type: "boolean" },
            },
        },
        postBlock: {
            type: "object",
            required: ["block"],
            additionalProperties: false,
            properties: {
                block: { $ref: "block" },
            },
        },
        postTransactions: {
            type: "object",
            required: ["transactions"],
            additionalProperties: false,
            properties: {
                transactions: {
                    $ref: "transactions",
                    minItems: 1,
                    maxItems: app.has("transaction-pool")
                        ? app.resolveOptions("transaction-pool").maxTransactionsPerRequest || 40
                        : 40,
                },
            },
        },
    },
    internal: {
        emitEvent: {
            type: "object",
            required: ["event", "body"],
            additionalProperties: false,
            properties: {
                event: { type: "string" },
                body: { type: "object" },
            },
        },
    },
};

export const replySchemas = {
    "p2p.peer.getBlocks": {
        type: "array",
        items: {
            type: "object",
            properties: {
                height: {
                    type: "integer",
                    minimum: 1,
                },
                id: {
                    type: "string",
                    maxLength: 64,
                    pattern: "[0-9a-fA-F]+", // hexadecimal
                },
            },
            required: ["height", "id"],
        },
    },
    "p2p.peer.getCommonBlocks": {
        type: "object",
        properties: {
            common: {
                anyOf: [
                    {
                        type: "object",
                        properties: {
                            height: {
                                type: "integer",
                                minimum: 1,
                            },
                            id: {
                                type: "string",
                                maxLength: 64,
                                pattern: "[0-9a-fA-F]+", // hexadecimal
                            },
                        },
                        required: ["height", "id"],
                    },
                    {
                        type: "null",
                    },
                ],
            },
        },
        required: ["common"],
    },
    "p2p.peer.getPeers": {
        type: "array",
        items: {
            type: "object",
            properties: {
                ip: {
                    anyOf: [
                        {
                            type: "string",
                            format: "ipv4",
                        },
                        {
                            type: "string",
                            format: "ipv6",
                        },
                    ],
                },
            },
            required: ["ip"],
        },
    },
    "p2p.peer.getStatus": {
        type: "object",
        required: ["state"],
        additionalProperties: false,
        properties: {
            state: { type: "object" },
            config: { type: "object" },
        },
        // @TODO: adjust schema to match { state, config }
        // type: "object",
        // properties: {
        //     header: {
        //         type: "object",
        //         properties: {
        //             height: {
        //                 type: "integer",
        //                 minimum: 1,
        //             },
        //             id: {
        //                 type: "string",
        //                 maxLength: 64,
        //                 pattern: "[0-9a-fA-F]+", // hexadecimal
        //             },
        //         },
        //         required: ["height", "id"],
        //     },
        //     height: {
        //         type: "integer",
        //         minimum: 1,
        //     },
        // },
        // required: ["header", "height"],
    },
    "p2p.peer.postBlock": {
        type: "object",
    },
    "p2p.peer.postTransactions": {
        type: "array",
    },
};
