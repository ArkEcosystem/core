export const replySchemas: any = {
    "p2p.peer.getBlocks": {
        type: "object",
        properties: {
            blocks: {
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
        },
        required: ["blocks"],
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
            success: {
                const: true,
            },
        },
        required: ["common", "success"],
    },

    "p2p.peer.getPeers": {
        type: "object",
        properties: {
            peers: {
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
            success: {
                const: true,
            },
        },
        required: ["peers", "success"],
    },

    "p2p.peer.getStatus": {
        type: "object",
        properties: {
            header: {
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
            height: {
                type: "integer",
                minimum: 1,
            },
            success: {
                const: true,
            },
        },
        required: ["header", "height", "success"],
    },

    "p2p.peer.postBlock": {
        type: "object",
        properties: {
            success: {
                type: "boolean",
            },
        },
        required: ["success"],
    },

    "p2p.peer.postTransactions": {
        type: "object",
        properties: {
            success: {
                type: "boolean",
            },
        },
        required: ["success"],
    },
};
