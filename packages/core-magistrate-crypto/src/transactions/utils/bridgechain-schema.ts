export const bridgechainSchema = {
    bridgechainId: {
        type: "integer",
        minimum: 1,
    },
    name: {
        type: "string",
        minLength: 1,
        maxLength: 40,
    },
    seedNodes: {
        type: "array",
        minItems: 1,
        maxItems: 10,
        uniqueItems: true,
        items: {
            type: "string",
            format: "peer",
        },
    },
    genesisHash: {
        type: "string",
        minLength: 64,
        maxLength: 64,
        $ref: "transactionId",
    },
    bridgechainRepository: {
        type: "string",
        minLength: 1,
        maxLength: 100,
    },
};
