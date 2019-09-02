// import { app } from "@arkecosystem/core-kernel";
import Joi from "@hapi/joi";

import { blockId } from "../shared/schemas/block-id";
import { pagination } from "../shared/schemas/pagination";

const address: object = Joi.string()
    .alphanum()
    .length(34);

export const index: object = {
    query: {
        ...pagination,
        ...{
            orderBy: Joi.string(),
            id: Joi.string()
                .hex()
                .length(64),
            blockId,
            type: Joi.number()
                .integer()
                .min(0),
            version: Joi.number()
                .integer()
                .positive(),
            senderPublicKey: Joi.string()
                .hex()
                .length(66),
            senderId: Joi.string()
                .alphanum()
                .length(34),
            recipientId: Joi.string()
                .alphanum()
                .length(34),
            timestamp: Joi.number()
                .integer()
                .min(0),
            amount: Joi.number()
                .integer()
                .min(0),
            fee: Joi.number()
                .integer()
                .min(0),
            vendorFieldHex: Joi.string().hex(),
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
            maxItems: 40,
            // @fixme: the container is not available at the time this file is loaded
            // maxItems: app.get<any>("transactionPool.options").maxTransactionsPerRequest,
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
        orderBy: Joi.string(),
        id: Joi.string()
            .hex()
            .length(64),
        blockId,
        type: Joi.number()
            .integer()
            .min(0),
        version: Joi.number()
            .integer()
            .positive(),
        senderPublicKey: Joi.string()
            .hex()
            .length(66),
        senderId: address,
        recipientId: address,
        addresses: Joi.array()
            .unique()
            .min(1)
            .max(50)
            .items(address),
        vendorFieldHex: Joi.string().hex(),
        timestamp: Joi.object().keys({
            from: Joi.number()
                .integer()
                .min(0),
            to: Joi.number()
                .integer()
                .min(0),
        }),
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
