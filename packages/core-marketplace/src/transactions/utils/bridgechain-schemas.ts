export const registeredBridgechainIdProperty = {
    type: "string",
    minLength: 64,
    maxLength: 64,
    $ref: "transactionId",
};

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
