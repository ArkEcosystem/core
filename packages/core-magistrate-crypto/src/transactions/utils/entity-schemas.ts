export const update = {
    type: "object",
    additionalProperties: false,
    properties: {
        ipfsData: { type: "string", pattern: "^Qm[A-HJ-NP-Za-km-z1-9]{44}$", minLength: 46, maxLength: 46 },
    },
};

export const register = {
    type: "object",
    required: ["name"],
    additionalProperties: false,
    properties: {
        name: { type: "string", pattern: "^[a-zA-Z0-9_-]+$", minLength: 1, maxLength: 40 },
        ...update.properties,
    },
};

export const resign = {
    type: "object",
    additionalProperties: false,
    maxProperties: 0,
};
