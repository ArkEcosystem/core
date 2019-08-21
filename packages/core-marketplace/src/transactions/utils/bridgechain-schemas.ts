export const seedNodesProperties = {
    type: "array",
    minItems: 1,
    maxItems: 10,
    uniqueItems: true,
    items: {
        type: "string",
        required: ["ip"],
        properties: {
            ip: {
                oneOf: [
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
    },
};
