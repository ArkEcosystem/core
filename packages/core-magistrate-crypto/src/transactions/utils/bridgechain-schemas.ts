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
    additionalProperties: false,
    patternProperties: {
        "^@arkecosystem/core-api$": {
            type: "integer",
            minimum: 0,
            maximum: 65535,
        },
    },
};
