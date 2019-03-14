/**
 * @type {Object}
 */
export const emitEvent = {
    type: "object",
    required: ["event", "body"],
    additionalProperties: false,
    properties: {
        event: { type: "string" },
        body: { type: "object" },
    },
};
