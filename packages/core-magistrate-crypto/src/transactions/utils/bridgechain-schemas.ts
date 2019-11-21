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
