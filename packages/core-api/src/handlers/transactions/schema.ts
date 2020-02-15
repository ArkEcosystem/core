import { app } from "@arkecosystem/core-container";
import Joi from "@hapi/joi";
import { transactionIteratees } from "../shared/iteratees";
import { address, blockId, orderBy, pagination, publicKey } from "../shared/schemas";

export const index: object = {
    query: {
        ...pagination,
        ...{
            orderBy: orderBy(transactionIteratees),
            id: Joi.string()
                .hex()
                .length(64),
            blockId,
            type: Joi.number()
                .integer()
                .min(0),
            typeGroup: Joi.number()
                .integer()
                .min(0),
            version: Joi.number()
                .integer()
                .positive(),
            senderPublicKey: publicKey,
            senderId: address,
            recipientId: address,
            timestamp: Joi.number()
                .integer()
                .min(0),
            nonce: Joi.number()
                .integer()
                .min(0),
            amount: Joi.number()
                .integer()
                .min(0),
            fee: Joi.number()
                .integer()
                .min(0),
            vendorField: Joi.string().max(255, "utf8"),
            transform: Joi.bool().default(true),
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
        id: Joi.string()
            .hex()
            .length(64),
    },
    query: {
        transform: Joi.bool().default(true),
    },
};

export const unconfirmed: object = {
    query: {
        ...pagination,
        ...{
            transform: Joi.bool().default(true),
        },
    },
};

export const showUnconfirmed: object = {
    params: {
        id: Joi.string()
            .hex()
            .length(64),
    },
};

export const search: object = {
    query: {
        ...pagination,
        ...{
            transform: Joi.bool().default(true),
        },
    },
    payload: {
        orderBy: orderBy(transactionIteratees),
        id: Joi.string()
            .hex()
            .length(64),
        blockId,
        type: Joi.number()
            .integer()
            .min(0),
        typeGroup: Joi.number()
            .integer()
            .min(0),
        version: Joi.number()
            .integer()
            .positive(),
        senderPublicKey: publicKey,
        senderId: address,
        recipientId: address,
        addresses: Joi.array()
            .unique()
            .min(1)
            .max(50)
            .items(address),
        vendorField: Joi.string().max(255, "utf8"),
        timestamp: Joi.object().keys({
            from: Joi.number()
                .integer()
                .min(0),
            to: Joi.number()
                .integer()
                .min(0),
        }),
        nonce: Joi.number()
            .integer()
            .min(0),
        amount: Joi.object().keys({
            from: Joi.number()
                .integer()
                .min(0),
            to: Joi.number()
                .integer()
                .min(0),
        }),
        fee: Joi.object().keys({
            from: Joi.number()
                .integer()
                .min(0),
            to: Joi.number()
                .integer()
                .min(0),
        }),
        asset: Joi.object(),
    },
};
