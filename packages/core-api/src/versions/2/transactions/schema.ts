import { app } from "@arkecosystem/core-container";
import joi from "@hapi/joi";
import { blockId } from "../shared/schemas/block-id";
import { pagination } from "../shared/schemas/pagination";

export const index: object = {
    query: {
        ...pagination,
        ...{
            orderBy: joi.string(),
            id: joi
                .string()
                .hex()
                .length(64),
            blockId,
            type: joi
                .number()
                .integer()
                .min(0),
            version: joi
                .number()
                .integer()
                .positive(),
            senderPublicKey: joi
                .string()
                .hex()
                .length(66),
            senderId: joi
                .string()
                .alphanum()
                .length(34),
            recipientId: joi
                .string()
                .alphanum()
                .length(34),
            ownerId: joi
                .string()
                .alphanum()
                .length(34),
            timestamp: joi
                .number()
                .integer()
                .min(0),
            amount: joi
                .number()
                .integer()
                .min(0),
            fee: joi
                .number()
                .integer()
                .min(0),
            vendorFieldHex: joi.string().hex(),
        },
    },
};

export const store: object = {
    type: "object",
    required: ["transactions"],
    additionalProperties: false,
    properties: {
        transactions: {
            $ref: "transactions",
            minItems: 1,
            maxItems: app.resolveOptions("transaction-pool").maxTransactionsPerRequest,
        },
    },
};

export const show: object = {
    params: {
        id: joi
            .string()
            .hex()
            .length(64),
    },
};

export const unconfirmed: object = {
    query: pagination,
};

export const showUnconfirmed: object = {
    params: {
        id: joi
            .string()
            .hex()
            .length(64),
    },
};

const address: object = joi
    .string()
    .alphanum()
    .length(34);

export const search: object = {
    query: pagination,
    payload: {
        orderBy: joi.string(),
        id: joi
            .string()
            .hex()
            .length(64),
        blockId,
        type: joi
            .number()
            .integer()
            .min(0),
        version: joi
            .number()
            .integer()
            .positive(),
        senderPublicKey: joi
            .string()
            .hex()
            .length(66),
        senderId: address,
        recipientId: address,
        ownerId: address,
        addresses: joi
            .array()
            .unique()
            .min(1)
            .max(50)
            .items(address),
        vendorFieldHex: joi.string().hex(),
        timestamp: joi.object().keys({
            from: joi
                .number()
                .integer()
                .min(0),
            to: joi
                .number()
                .integer()
                .min(0),
        }),
        amount: joi.object().keys({
            from: joi
                .number()
                .integer()
                .min(0),
            to: joi
                .number()
                .integer()
                .min(0),
        }),
        fee: joi.object().keys({
            from: joi
                .number()
                .integer()
                .min(0),
            to: joi
                .number()
                .integer()
                .min(0),
        }),
    },
};
