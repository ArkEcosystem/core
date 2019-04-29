import deepmerge = require("deepmerge");
import { TransactionTypes } from "../../enums";

const signedTransaction = {
    required: ["id", "signature"],
};

const strictTransaction = {
    additionalProperties: false,
};

export const transactionBaseSchema = {
    $id: null,
    type: "object",
    required: ["type", "senderPublicKey", "fee", "timestamp"],
    properties: {
        id: { anyOf: [{ $ref: "transactionId" }, { type: "null" }] },
        version: { enum: [1, 2] },
        network: { $ref: "networkByte" },
        expiration: { type: "integer" },
        timestamp: { type: "integer", minimum: 0 },
        amount: { bignumber: { minimum: 1, bypassGenesis: true } },
        fee: { bignumber: { minimum: 1, bypassGenesis: true } },
        senderPublicKey: { $ref: "publicKey" },
        signature: { $ref: "alphanumeric" },
        secondSignature: { $ref: "alphanumeric" },
        signSignature: { $ref: "alphanumeric" },
    },
};

export function extend(parent, properties): TransactionSchema {
    return deepmerge(parent, properties);
}

export function signedSchema(schema: TransactionSchema): TransactionSchema {
    const signed = extend(schema, signedTransaction);
    signed.$id = `${schema.$id}Signed`;
    return signed;
}

export function strictSchema(schema: TransactionSchema): TransactionSchema {
    const signed = signedSchema(schema);
    const strict = extend(signed, strictTransaction);
    strict.$id = `${schema.$id}Strict`;
    return strict;
}

export const transfer = extend(transactionBaseSchema, {
    $id: "transfer",
    required: ["recipientId", "amount"],
    properties: {
        type: { transactionType: TransactionTypes.Transfer },
        vendorField: { anyOf: [{ type: "null" }, { type: "string", format: "vendorField" }] },
        vendorFieldHex: { anyOf: [{ type: "null" }, { type: "string", format: "vendorFieldHex" }] },
        recipientId: { $ref: "address" },
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
    properties: {
        type: { transactionType: TransactionTypes.MultiSignature },
        amount: { bignumber: { minimum: 0, maximum: 0 } },
    },
});

export const ipfs = extend(transactionBaseSchema, {
    $id: "ipfs",
    properties: {
        type: { transactionType: TransactionTypes.Ipfs },
        amount: { bignumber: { minimum: 0, maximum: 0 } },
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
    },
});

export const delegateResignation = extend(transactionBaseSchema, {
    $id: "delegateResignation",
    properties: {
        type: { transactionType: TransactionTypes.DelegateResignation },
        amount: { bignumber: { minimum: 0, maximum: 0 } },
    },
});

export type TransactionSchema = typeof transactionBaseSchema;
