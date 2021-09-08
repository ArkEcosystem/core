import { constants } from "./constants";

export const replySchemas = {
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
        maxItems: constants.MAX_PEERS_GETPEERS,
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
                port: {
                    type: "integer",
                    minimum: 0,
                    maximum: 65535,
                },
            },
            required: ["ip", "port"],
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
                                        maxLength: 4,
                                    },
                                },
                            },
                        },
                    },
                    plugins: {
                        type: "object",
                        maxProperties: 32,
                        minProperties: 0,
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
                                    estimateTotalCount: {
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
    "p2p.blocks.getBlocks": {
        type: "array",
        maxItems: 400,
        items: {
            $ref: "blockHeader",
        },
    },
    "p2p.blocks.postBlock": {
        type: "object",
        additionalProperties: false,
        properties: {
            status: { type: "boolean" },
            height: { type: "integer", minimum: 1 },
        },
    },
    "p2p.transactions.postTransactions": {
        type: "array",
    },
};
