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
    maxProperties: 10,
    minProperties: 1,
    required: ["@arkecosystem/core-api"],
    additionalProperties: false,
    patternProperties: {
        // just allow anything within length limitation of npm package name, more
        // precise validation will be done in transaction handler
        "^.{1,214}$": {
            type: "integer",
            minimum: 0,
            maximum: 65535,
        },
    },
};
