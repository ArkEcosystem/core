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
                serialized: { type: "boolean" },
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
        maxItems: 400,
        items: {
            $ref: "blockHeader",
        },
    },
    "p2p.peer.getCommonBlocks": {
        type: "object",
        additionalProperties: false,
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
                            id: { blockId: {} },
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
        maxItems: 2000,
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
        required: ["state", "config"],
        additionalProperties: false,
        properties: {
            state: {
                type: "object",
                required: ["height", "forgingAllowed", "currentSlot", "header"],
                properties: {
                    height: {
                        type: "integer",
                        minimum: 1,
                    },
                    forgingAllowed: {
                        type: "boolean",
                    },
                    currentSlot: {
                        type: "integer",
                        minimum: 1,
                    },
                    header: {
                        anyOf: [
                            {
                                $ref: "blockHeader",
                            },
                            {
                                type: "object",
                                minProperties: 0,
                                maxProperties: 0,
                            },
                        ],
                    },
                },
            },
            config: {
                type: "object",
                required: ["version", "network", "plugins"],
                additionalProperties: false,
                properties: {
                    version: {
                        type: "string",
                        minLength: 5,
                        maxLength: 24,
                    },
                    network: {
                        type: "object",
                        required: ["name", "nethash", "explorer", "token"],
                        additionalProperties: false,
                        properties: {
                            name: {
                                type: "string",
                                minLength: 1,
                                maxLength: 20,
                            },
                            version: {
                                type: "integer",
                                minimum: 0,
                                maximum: 255,
                            },
                            nethash: {
                                allOf: [
                                    {
                                        $ref: "hex",
                                    },
                                    {
                                        minLength: 64,
                                        maxLength: 64,
                                    },
                                ],
                            },
                            explorer: {
                                type: "string",
                                minLength: 0,
                                maxLength: 128,
                            },
                            token: {
                                type: "object",
                                required: ["name", "symbol"],
                                additionalProperties: false,
                                properties: {
                                    name: {
                                        type: "string",
                                        minLength: 1,
                                        maxLength: 8,
                                    },
                                    symbol: {
                                        type: "string",
                                        minLength: 1,
                                        maxLength: 3,
                                    },
                                },
                            },
                        },
                    },
                    plugins: {
                        type: "object",
                        maxProperties: 32,
                        minProperties: 1,
                        additionalProperties: false,
                        patternProperties: {
                            "^.{4,64}$": {
                                type: "object",
                                required: ["port", "enabled"],
                                additionalProperties: false,
                                properties: {
                                    port: {
                                        type: "integer",
                                        minimum: 0,
                                        maximum: 65535,
                                    },
                                    enabled: {
                                        type: "boolean",
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
    "p2p.peer.postBlock": {
        type: "object",
    },
    "p2p.peer.postTransactions": {
        type: "array",
    },
};
