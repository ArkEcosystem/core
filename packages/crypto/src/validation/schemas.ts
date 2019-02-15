export const schemas = {
    hex: {
        $id: "hex",
        type: "string",
        pattern: "^[0123456789A-Fa-f]+$",
    },

    base58: {
        $id: "base58",
        type: "string",
        pattern: "^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$",
    },

    numericString: {
        $id: "numericString",
        type: "string",
        pattern: "^[0-9]+$",
    },

    alphanumeric: {
        $id: "alphanumeric",
        type: "string",
        pattern: "^[a-zA-Z0-9]+$",
    },

    transactionId: {
        $id: "transactionId",
        allOf: [{ minLength: 64 }, { maxLength: 64 }, { $ref: "alphanumeric" }],
    },

    address: {
        $id: "address",
        allOf: [{ $ref: "base58" }, { minLength: 34, maxLength: 34 }],
    },

    blockId: {
        $id: "blockId",
        $ref: "numericString",
    },

    publicKey: {
        $id: "publicKey",
        allOf: [{ $ref: "hex" }, { minLength: 66, maxLength: 66 }, { transform: ["toLowerCase"] }],
    },

    walletVote: {
        $id: "walletVote",
        allOf: [{ pattern: "^[+|-][a-zA-Z0-9]{66}$" }, { transform: ["toLowerCase"] }],
    },

    username: {
        $id: "delegateUsername",
        allOf: [
            { type: "string" },
            { pattern: "^[a-z0-9!@$&_.]+$" },
            { minLength: 1, maxLength: 20 },
            { transform: ["toLowerCase"] },
        ],
    },
};
