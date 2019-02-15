import Ajv from "ajv";
import ajvKeywords from "ajv-keywords";
import ajvMerge from "ajv-merge-patch";
import deepmerge = require("deepmerge");
import { TransactionTypes } from "../../constants";
import { Bignum } from "../../utils";

const schemas = {
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

const extend = (parent, properties) => {
    return deepmerge(parent, properties);
};

const base = {
    type: "object",
    required: ["id", "type", "signature", "senderPublicKey", "amount", "fee", "timestamp"],
    additionalProperties: false,
    properties: {
        id: { $ref: "transactionId" },
        version: { enum: [1, 2] },
        type: { type: "integer", minimum: 0, maximum: 255 },
        timestamp: { type: "integer", minimum: 0 },
        amount: { bignumber: { minimum: 1 } },
        fee: { bignumber: { minimum: 1 } },
        senderPublicKey: { $ref: "publicKey" },
        signature: { $ref: "alphanumeric" },
        secondSignature: { $ref: "alphanumeric" },
    },
};

const transactions = {
    transfer: extend(base, {
        $id: "transfer",
        required: ["recipientId"],
        properties: {
            type: { transactionType: TransactionTypes.Transfer },
            vendorField: { type: "string", maxBytes: 64 },
            vendorFieldHex: { $ref: "hex", maximumLength: 128 },
            recipientId: { $ref: "address" },
        },
    }),

    secondSignature: extend(base, {
        $id: "secondSignature",
        required: ["asset"],
        properties: {
            type: { transactionType: TransactionTypes.SecondSignature },
            amount: { bignumber: { minimum: 0, maximum: 0 } },
            asset: {
                maxProperties: 1,
                properties: {
                    signature: {
                        type: "object",
                        properties: {
                            publicKey: {
                                $ref: "publicKey",
                            },
                        },
                    },
                },
            },
        },
    }),

    delegateRegistration: extend(base, {
        $id: "delegateRegistration",
        required: ["asset"],
        properties: {
            type: { transactionType: TransactionTypes.DelegateRegistration },
            amount: { bignumber: { minimum: 0, maximum: 0 } },
            asset: {
                maxProperties: 1,
                properties: {
                    delegate: {
                        properties: {
                            username: { $ref: "delegateUsername" },
                        },
                    },
                },
            },
        },
    }),

    vote: extend(base, {
        $id: "vote",
        required: ["asset"],
        properties: {
            type: { transactionType: TransactionTypes.Vote },
            amount: { bignumber: { minimum: 0, maximum: 0 } },
            asset: {
                properties: {
                    votes: {
                        type: "array",
                        minItems: 1,
                        additionalItems: false,
                        uniqueItems: true,
                        items: { $ref: "walletVote" },
                    },
                },
            },
        },
    }),
};

const blblbbl = {
    version: 2,
    network: 23,
    type: 3,
    timestamp: 58126413,
    senderPublicKey: "03d7dfe44e771039334f4712fb95ad355254f674c8f5d286503199157b7bf7c357",
    fee: "10000000",
    amount: "0",
    vendorFieldHex: "5472616e73616374696f6e2037",
    expiration: 0,
    recipientId: "APyFYXxXtUrvZFnEuwLopfst94GMY5Zkeq",
    secondSignature: "aaa",
    signature:
        "3045022100bac5b7699748a891b39ff5439e16ea1a694e93954b248be6b8082da01e5386310220129eb06a58b9f80d36ea3cdc903e6cc0240bbe1d371339ffe15c87742af1427d",
    vendorField: "⊁".repeat(21), // "Transaction 7",
    id: "00d2025f7914a8e794bdaea404a579840cf71402cef312d2080c7ecd86177e5f",
    asset: {
        votes: ["+03d7dfe44e771039334f4712fb95ad355254f674c8f5d286503199157b7bf7c357"],
    },
};

const ajv = new Ajv({ $data: true, schemas: { ...schemas, ...transactions }, removeAdditional: true });
ajvKeywords(ajv);
ajvMerge(ajv);

const instanceOf = ajvKeywords.get("instanceof").definition;
instanceOf.CONSTRUCTORS.Bignum = Bignum;

ajv.addKeyword("bignumber", {
    type: ["string"],
    compile(schema) {
        const validateCoerced = ajv.compile(schema);
        return (data, dataPath, parentObject, property) => {
            const minimum = typeof schema.minimum !== "undefined" ? schema.minimum : 0;
            const maximum = typeof schema.maximum !== "undefined" ? schema.maximum : Number.MAX_SAFE_INTEGER;

            const bignum = new Bignum(data);

            if (!bignum.isInteger()) {
                return false;
            }

            if (bignum.isLessThan(minimum)) {
                return false;
            }

            if (bignum.isGreaterThan(maximum)) {
                return false;
            }

            parentObject[property] = bignum;
            return validateCoerced(data);
        };
    },
    errors: true,
    metaSchema: {
        type: "object",
        properties: {
            minimum: { type: "integer" },
            maximum: { type: "integer" },
        },
        additionalItems: false,
    },
});

ajv.addKeyword("maxBytes", {
    type: "string",
    compile(schema, parentSchema) {
        return data => {
            const maxBytes = schema;
            if ((parentSchema as any).type !== "string") {
                return false;
            }

            return Buffer.from(data, "utf8").byteLength <= maxBytes;
        };
    },
    errors: false,
    metaSchema: {
        type: "integer",
        minimum: 0,
    },
});

ajv.addKeyword("transactionType", {
    type: "integer",
    compile(schema) {
        return data => {
            return data === schema;
        };
    },
    errors: false,
    metaSchema: {
        type: "integer",
        minimum: 0,
    },
});

console.log(ajv.validate("vote", blblbbl));
console.log(ajv.errors);
console.log(blblbbl);
