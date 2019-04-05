export const emitEvent = {
    type: "object",
    required: ["event", "body"],
    additionalProperties: false,
    properties: {
        event: { type: "string" },
        body: { type: "object" },
    },
};

export const verifyTransaction = {
    type: "object",
    required: ["transaction"],
    additionalProperties: false,
    properties: {
        transaction: { $ref: "transaction" },
    },
};
