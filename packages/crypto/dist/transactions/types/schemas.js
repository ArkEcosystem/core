"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const deepmerge_1 = __importDefault(require("deepmerge"));
const enums_1 = require("../../enums");
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
exports.transactionBaseSchema = {
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
        typeGroup: { type: "integer", minimum: 0 },
        amount: { bignumber: { minimum: 1, bypassGenesis: true } },
        fee: { bignumber: { minimum: 0, bypassGenesis: true } },
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
exports.extend = (parent, properties) => {
    return deepmerge_1.default(parent, properties);
};
exports.signedSchema = (schema) => {
    const signed = exports.extend(schema, signedTransaction);
    signed.$id = `${schema.$id}Signed`;
    return signed;
};
exports.strictSchema = (schema) => {
    const signed = exports.signedSchema(schema);
    const strict = exports.extend(signed, strictTransaction);
    strict.$id = `${schema.$id}Strict`;
    return strict;
};
exports.transfer = exports.extend(exports.transactionBaseSchema, {
    $id: "transfer",
    required: ["recipientId"],
    properties: {
        type: { transactionType: enums_1.TransactionType.Transfer },
        fee: { bignumber: { minimum: 1, bypassGenesis: true } },
        vendorField: { anyOf: [{ type: "null" }, { type: "string", format: "vendorField" }] },
        recipientId: { $ref: "address" },
        expiration: { type: "integer", minimum: 0 },
    },
});
exports.secondSignature = exports.extend(exports.transactionBaseSchema, {
    $id: "secondSignature",
    required: ["asset"],
    properties: {
        type: { transactionType: enums_1.TransactionType.SecondSignature },
        amount: { bignumber: { minimum: 0, maximum: 0 } },
        fee: { bignumber: { minimum: 1 } },
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
exports.delegateRegistration = exports.extend(exports.transactionBaseSchema, {
    $id: "delegateRegistration",
    required: ["asset"],
    properties: {
        type: { transactionType: enums_1.TransactionType.DelegateRegistration },
        amount: { bignumber: { minimum: 0, maximum: 0 } },
        fee: { bignumber: { minimum: 1, bypassGenesis: true } },
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
exports.vote = exports.extend(exports.transactionBaseSchema, {
    $id: "vote",
    required: ["asset"],
    properties: {
        type: { transactionType: enums_1.TransactionType.Vote },
        amount: { bignumber: { minimum: 0, maximum: 0 } },
        fee: { bignumber: { minimum: 1 } },
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
exports.multiSignature = exports.extend(exports.transactionBaseSchema, {
    $id: "multiSignature",
    required: ["asset", "signatures"],
    properties: {
        type: { transactionType: enums_1.TransactionType.MultiSignature },
        amount: { bignumber: { minimum: 0, maximum: 0 } },
        fee: { bignumber: { minimum: 1 } },
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
                            uniqueItems: true,
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
// Multisignature legacy transactions have a different signatures property.
// Then we delete the "signatures" property definition to implement our own.
const transactionBaseSchemaNoSignatures = exports.extend(exports.transactionBaseSchema, {});
delete transactionBaseSchemaNoSignatures.properties.signatures;
exports.multiSignatureLegacy = exports.extend(transactionBaseSchemaNoSignatures, {
    $id: "multiSignatureLegacy",
    required: ["asset"],
    properties: {
        version: { anyOf: [{ type: "null" }, { const: 1 }] },
        type: { transactionType: enums_1.TransactionType.MultiSignature },
        amount: { bignumber: { minimum: 0, maximum: 0 } },
        fee: { bignumber: { minimum: 1 } },
        asset: {
            type: "object",
            required: ["multiSignatureLegacy"],
            properties: {
                multiSignatureLegacy: {
                    type: "object",
                    required: ["keysgroup", "min", "lifetime"],
                    properties: {
                        min: {
                            type: "integer",
                            minimum: 1,
                            maximum: { $data: "1/keysgroup/length" },
                        },
                        lifetime: {
                            type: "integer",
                            minimum: 1,
                            maximum: 72,
                        },
                        keysgroup: {
                            type: "array",
                            minItems: 1,
                            maxItems: 16,
                            additionalItems: false,
                            items: {
                                allOf: [{ type: "string", minimum: 67, maximum: 67, transform: ["toLowerCase"] }],
                            },
                        },
                    },
                },
            },
        },
        signatures: {
            type: "array",
            minItems: 1,
            maxItems: 1,
            additionalItems: false,
            items: { $ref: "alphanumeric" },
        },
    },
});
exports.ipfs = exports.extend(exports.transactionBaseSchema, {
    $id: "ipfs",
    properties: {
        type: { transactionType: enums_1.TransactionType.Ipfs },
        amount: { bignumber: { minimum: 0, maximum: 0 } },
        fee: { bignumber: { minimum: 1 } },
        asset: {
            type: "object",
            required: ["ipfs"],
            properties: {
                ipfs: {
                    allOf: [{ minLength: 2, maxLength: 90 }, { $ref: "base58" }],
                },
            },
        },
    },
});
exports.htlcLock = exports.extend(exports.transactionBaseSchema, {
    $id: "htlcLock",
    properties: {
        type: { transactionType: enums_1.TransactionType.HtlcLock },
        amount: { bignumber: { minimum: 1 } },
        fee: { bignumber: { minimum: 1 } },
        recipientId: { $ref: "address" },
        vendorField: { anyOf: [{ type: "null" }, { type: "string", format: "vendorField" }] },
        asset: {
            type: "object",
            required: ["lock"],
            properties: {
                lock: {
                    type: "object",
                    required: ["secretHash", "expiration"],
                    properties: {
                        secretHash: { allOf: [{ minLength: 64, maxLength: 64 }, { $ref: "hex" }] },
                        expiration: {
                            type: "object",
                            required: ["type", "value"],
                            properties: {
                                type: { enum: [1, 2] },
                                value: { type: "integer", minimum: 0 },
                            },
                        },
                    },
                },
            },
        },
    },
});
exports.htlcClaim = exports.extend(exports.transactionBaseSchema, {
    $id: "htlcClaim",
    properties: {
        type: { transactionType: enums_1.TransactionType.HtlcClaim },
        amount: { bignumber: { minimum: 0, maximum: 0 } },
        fee: { bignumber: { minimum: 0, maximum: 0 } },
        asset: {
            type: "object",
            required: ["claim"],
            properties: {
                claim: {
                    type: "object",
                    required: ["lockTransactionId", "unlockSecret"],
                    properties: {
                        lockTransactionId: { $ref: "transactionId" },
                        unlockSecret: { allOf: [{ minLength: 64, maxLength: 64 }, { $ref: "hex" }] },
                    },
                },
            },
        },
    },
});
exports.htlcRefund = exports.extend(exports.transactionBaseSchema, {
    $id: "htlcRefund",
    properties: {
        type: { transactionType: enums_1.TransactionType.HtlcRefund },
        amount: { bignumber: { minimum: 0, maximum: 0 } },
        fee: { bignumber: { minimum: 0, maximum: 0 } },
        asset: {
            type: "object",
            required: ["refund"],
            properties: {
                refund: {
                    type: "object",
                    required: ["lockTransactionId"],
                    properties: {
                        lockTransactionId: { $ref: "transactionId" },
                    },
                },
            },
        },
    },
});
exports.multiPayment = exports.extend(exports.transactionBaseSchema, {
    $id: "multiPayment",
    properties: {
        type: { transactionType: enums_1.TransactionType.MultiPayment },
        amount: { bignumber: { minimum: 0, maximum: 0 } },
        fee: { bignumber: { minimum: 1 } },
        vendorField: { anyOf: [{ type: "null" }, { type: "string", format: "vendorField" }] },
        asset: {
            type: "object",
            required: ["payments"],
            properties: {
                payments: {
                    type: "array",
                    minItems: 2,
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
exports.delegateResignation = exports.extend(exports.transactionBaseSchema, {
    $id: "delegateResignation",
    properties: {
        type: { transactionType: enums_1.TransactionType.DelegateResignation },
        amount: { bignumber: { minimum: 0, maximum: 0 } },
        fee: { bignumber: { minimum: 1 } },
    },
});
//# sourceMappingURL=schemas.js.map