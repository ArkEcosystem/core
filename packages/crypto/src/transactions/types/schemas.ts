import deepmerge = require("deepmerge");
import { TransactionTypes } from "../../enums";

const signedTransaction = {
    anyOf: [
        { required: ["id", "signature"] },
        { required: ["id", "signature", "signatures"] },
        { required: ["id", "signatures"] },
    ],
};

const strictTransaction = {
    additionalProperties: false,
};

export const transactionBaseSchema = {
    $id: undefined,
    type: "object",
    if: { properties: { version: { anyOf: [{ type: "null" }, { const: 1 }] } } },
    then: { required: ["type", "senderPublicKey", "fee", "amount", "timestamp"] },
    else: { required: ["type", "senderPublicKey", "fee", "amount", "nonce"] },
    properties: {
        id: { anyOf: [{ $ref: "transactionId" }, { type: "null" }] },
        version: { enum: [1, 2] },
        network: { $ref: "networkByte" },
        timestamp: { type: "integer", minimum: 0 },
        nonce: { bignumber: { minimum: 0 } },
        amount: { bignumber: { minimum: 1, bypassGenesis: true } },
        fee: { bignumber: { minimum: 1, bypassGenesis: true } },
        senderPublicKey: { $ref: "publicKey" },
        signature: { $ref: "alphanumeric" },
        secondSignature: { $ref: "alphanumeric" },
        signSignature: { $ref: "alphanumeric" },
        signatures: {
            type: "array",
            minItems: 1,
            maxItems: 16,
            additionalItems: false,
            uniqueItems: true,
            items: { allOf: [{ minLength: 130, maxLength: 130 }, { $ref: "alphanumeric" }] },
        },
    },
};

export const extend = (parent, properties): TransactionSchema => {
    return deepmerge(parent, properties);
};

export const signedSchema = (schema: TransactionSchema): TransactionSchema => {
    const signed = extend(schema, signedTransaction);
    signed.$id = `${schema.$id}Signed`;
    return signed;
};

export const strictSchema = (schema: TransactionSchema): TransactionSchema => {
    const signed = signedSchema(schema);
    const strict = extend(signed, strictTransaction);
    strict.$id = `${schema.$id}Strict`;
    return strict;
};

export const transfer = extend(transactionBaseSchema, {
    $id: "transfer",
    required: ["recipientId"],
    properties: {
        type: { transactionType: TransactionTypes.Transfer },
        vendorField: { anyOf: [{ type: "null" }, { type: "string", format: "vendorField" }] },
        vendorFieldHex: { anyOf: [{ type: "null" }, { type: "string", format: "vendorFieldHex" }] },
        recipientId: { $ref: "address" },
        expiration: { type: "integer", minimum: 0 },
    },
});

export const secondSignature = extend(transactionBaseSchema, {
    $id: "secondSignature",
    required: ["asset"],
    properties: {
        type: { transactionType: TransactionTypes.SecondSignature },
        amount: { bignumber: { minimum: 0, maximum: 0 } },
        secondSignature: { type: "null" },
        asset: {
            type: "object",
            required: ["signature"],
            properties: {
                signature: {
                    type: "object",
                    required: ["publicKey"],
                    properties: {
                        publicKey: {
                            $ref: "publicKey",
                        },
                    },
                },
            },
        },
    },
});

export const delegateRegistration = extend(transactionBaseSchema, {
    $id: "delegateRegistration",
    required: ["asset"],
    properties: {
        type: { transactionType: TransactionTypes.DelegateRegistration },
        amount: { bignumber: { minimum: 0, maximum: 0 } },
        asset: {
            type: "object",
            required: ["delegate"],
            properties: {
                delegate: {
                    type: "object",
                    required: ["username"],
                    properties: {
                        username: { $ref: "delegateUsername" },
                    },
                },
            },
        },
    },
});

export const vote = extend(transactionBaseSchema, {
    $id: "vote",
    required: ["asset"],
    properties: {
        type: { transactionType: TransactionTypes.Vote },
        amount: { bignumber: { minimum: 0, maximum: 0 } },
        recipientId: { $ref: "address" },
        asset: {
            type: "object",
            required: ["votes"],
            properties: {
                votes: {
                    type: "array",
                    minItems: 1,
                    maxItems: 1,
                    additionalItems: false,
                    items: { $ref: "walletVote" },
                },
            },
        },
    },
});

export const multiSignature = extend(transactionBaseSchema, {
    $id: "multiSignature",
    required: ["asset", "signatures"],
    properties: {
        type: { transactionType: TransactionTypes.MultiSignature },
        amount: { bignumber: { minimum: 0, maximum: 0 } },
        asset: {
            type: "object",
            required: ["multiSignature"],
            properties: {
                multiSignature: {
                    type: "object",
                    required: ["min", "publicKeys"],
                    properties: {
                        min: {
                            type: "integer",
                            minimum: 1,
                            maximum: { $data: "1/publicKeys/length" },
                        },
                        publicKeys: {
                            type: "array",
                            minItems: 1,
                            maxItems: 16,
                            additionalItems: false,
                            items: { $ref: "publicKey" },
                        },
                    },
                },
            },
        },
        signatures: {
            type: "array",
            minItems: { $data: "1/asset/multiSignature/min" },
            maxItems: { $data: "1/asset/multiSignature/publicKeys/length" },
            additionalItems: false,
            uniqueItems: true,
            items: { allOf: [{ minLength: 130, maxLength: 130 }, { $ref: "alphanumeric" }] },
        },
    },
});

export const ipfs = extend(transactionBaseSchema, {
    $id: "ipfs",
    properties: {
        type: { transactionType: TransactionTypes.Ipfs },
        amount: { bignumber: { minimum: 0, maximum: 0 } },
        asset: {
            type: "object",
            required: ["ipfs"],
            properties: {
                ipfs: {
                    allOf: [{ minLength: 2, maxLength: 90 }, { $ref: "base58" }],
                    // ipfs hash has varying length but we set max limit to twice the length of base58 ipfs sha-256 hash
                },
            },
        },
    },
});

export const timelockTransfer = extend(transactionBaseSchema, {
    $id: "timelockTransfer",
    properties: {
        type: { transactionType: TransactionTypes.TimelockTransfer },
        amount: { bignumber: { minimum: 0, maximum: 0 } },
    },
});

export const multiPayment = extend(transactionBaseSchema, {
    $id: "multiPayment",
    properties: {
        type: { transactionType: TransactionTypes.MultiPayment },
        amount: { bignumber: { minimum: 0, maximum: 0 } },
        asset: {
            type: "object",
            required: ["payments"],
            properties: {
                payments: {
                    type: "array",
                    minItems: 2,
                    maxItems: 500,
                    additionalItems: false,
                    uniqueItems: false,
                    items: {
                        type: "object",
                        required: ["amount", "recipientId"],
                        properties: {
                            amount: { bignumber: { minimum: 1 } },
                            recipientId: { $ref: "address" },
                        },
                    },
                },
            },
        },
    },
});

export const delegateResignation = extend(transactionBaseSchema, {
    $id: "delegateResignation",
    properties: {
        type: { transactionType: TransactionTypes.DelegateResignation },
        amount: { bignumber: { minimum: 0, maximum: 0 } },
    },
});

export const businessRegistration = extend(transactionBaseSchema, {
    $id: "businessRegistration",
    required: ["asset"],
    properties: {
        type: { transactionType: TransactionTypes.BusinessRegistration },
        amount: { bignumber: { minimum: 0, maximum: 0 } },
        asset: {
            type: "object",
            required: ["businessRegistration"],
            properties: {
                businessRegistration: {
                    type: "object",
                    required: ["name", "websiteAddress"],
                    properties: {
                        name: {
                            type: "string",
                            minLength: 1,
                            maxLength: 30,
                        },
                        websiteAddress: {
                            type: "string",
                            minLength: 3,
                            maxLength: 20,
                        },
                        vat: {
                            type: "string",
                            minLength: 10,
                            maxLength: 10,
                        },
                        githubRepository: {
                            type: "string",
                            minLength: 3,
                            maxLength: 50,
                        },
                        trustLink: {
                            type: "string",
                            minLength: 3,
                            maxLength: 50,
                        },
                    },
                },
            },
        },
    },
});

export type TransactionSchema = typeof transactionBaseSchema;
