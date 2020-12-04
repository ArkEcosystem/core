export const update = {
    type: "object",
    additionalProperties: false,
    properties: {
        ipfsData: {
            allOf: [
                { $ref: "base58" },
                { type: "string", minLength: 1, maxLength: 128 }, // 128 should be more than enough for all variations of ipfs hashes
            ],
        },
    },
};

export const register = {
    type: "object",
    required: ["name"],
    additionalProperties: false,
    properties: {
        name: { type: "string", pattern: "^[a-zA-Z0-9_!@$&.-]+$", minLength: 1, maxLength: 40 },
        ...update.properties,
    },
};

export const resign = {
    type: "object",
    additionalProperties: false,
    maxProperties: 0,
};
