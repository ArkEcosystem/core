/**
 * @type {Object}
 */
export const verify = {
    type: "object",
    required: ["transaction"],
    additionalProperties: false,
    properties: {
        transaction: { $ref: "transaction" },
    },
};
