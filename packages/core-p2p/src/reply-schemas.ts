export const replySchemas: any = {
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
        },
        required: ["header", "height"],
    },
    "p2p.peer.postBlock": {
        type: "object",
    },
    "p2p.peer.postTransactions": {
        type: "array",
    },
};
