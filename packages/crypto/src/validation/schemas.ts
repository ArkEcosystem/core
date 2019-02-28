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

    alphanumeric: {
        $id: "alphanumeric",
        type: "string",
        pattern: "^[a-zA-Z0-9]+$",
    },

    transactionId: {
        $id: "transactionId",
        allOf: [{ minLength: 64, maxLength: 64 }, { $ref: "alphanumeric" }],
    },

    networkByte: {
        $id: "networkByte",
        network: true,
    },

    address: {
        $id: "address",
        allOf: [{ minLength: 34, maxLength: 34 }, { $ref: "base58" }],
    },

    blockId: {
        $id: "blockId",
        $ref: "hex",
    },

    publicKey: {
        $id: "publicKey",
        allOf: [{ minLength: 66, maxLength: 66 }, { $ref: "hex" }, { transform: ["toLowerCase"] }],
    },

    walletVote: {
        $id: "walletVote",
        allOf: [{ type: "string", pattern: "^[+|-][a-zA-Z0-9]{66}$" }, { transform: ["toLowerCase"] }],
    },

    username: {
        $id: "delegateUsername",
        allOf: [
            { type: "string", pattern: "^[a-z0-9!@$&_.]+$" },
            { minLength: 1, maxLength: 20 },
            { transform: ["toLowerCase"] },
        ],
    },

    block: {
        $id: "block",
        type: "object",
        required: [
            "id",
            "timestamp",
            "previousBlock",
            "height",
            "totalAmount",
            "totalFee",
            "reward",
            "generatorPublicKey",
            "blockSignature",
            "transactions",
        ],
        additionalProperties: false,
        properties: {
            id: { $ref: "blockId" },
            idHex: { $ref: "hex" },
            version: { type: "integer", minimum: 0 },
            timestamp: { type: "integer", minimum: 0 },
            previousBlock: { $ref: "blockId" },
            previousBlockHex: { $ref: "hex" },
            height: { type: "integer", minimum: 1 },
            numberOfTransactions: { type: "integer" },
            totalAmount: { bignumber: { minimum: 0, bypassGenesis: true } },
            totalFee: { bignumber: { minimum: 0, bypassGenesis: true } },
            reward: { bignumber: { minimum: 0 } },
            payloadLength: { type: "integer", minimum: 0 },
            payloadHash: { $ref: "hex" },
            generatorPublicKey: { $ref: "publicKey" },
            blockSignature: { $ref: "hex" },
            transactions: { $ref: "transactions" },
        },
    },
};
