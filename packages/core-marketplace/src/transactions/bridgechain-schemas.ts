export const registeredBridgechainIdProperty = {
    type: "string",
    minLength: 64,
    maxLength: 64,
};

export const seedNodesProperties = {
    type: "array",
    maxItems: 15,
    minItems: 1,
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
