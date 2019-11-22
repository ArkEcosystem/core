export const seedNodesSchema = {
    type: "array",
    minItems: 1,
    maxItems: 10,
    uniqueItems: true,
    items: {
        type: "string",
        format: "peer",
    },
};

export const portsSchema = {
    type: "object",
    maxProperties: 1,
    minProperties: 1,
    required: ["@arkecosystem/core-api"],
    additionalProperties: false,
    properties: {
        "@arkecosystem/core-api": {
            type: "integer",
            minimum: 0,
            maximum: 65535,
        },
    },
};
