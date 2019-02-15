import deepmerge = require("deepmerge");
import { TransactionTypes } from "../../constants";

const extend = (parent, properties): TransactionSchema => {
    return deepmerge(parent, properties);
};

export type TransactionSchema = typeof transactionBaseSchema;

const transactionBaseSchema = {
    $id: null,
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

export const transfer = extend(transactionBaseSchema, {
    $id: "transfer",
    required: ["recipientId"],
    properties: {
        type: { transactionType: TransactionTypes.Transfer },
        vendorField: { type: "string", maxBytes: 64 },
        vendorFieldHex: { $ref: "hex", maximumLength: 128 },
        recipientId: { $ref: "address" },
    },
});

export const secondSignature = extend(transactionBaseSchema, {
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
});

export const delegateRegistration = extend(transactionBaseSchema, {
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
});

export const vote = extend(transactionBaseSchema, {
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
