import { app } from "@arkecosystem/core-container";
import { Joi } from "@arkecosystem/crypto";
import { pagination } from "../shared/schemas/pagination";

export const index: object = {
    query: {
        ...pagination,
        ...{
            orderBy: Joi.string(),
            id: Joi.string()
                .hex()
                .length(64),
            blockId: Joi.string().regex(/^[0-9]+$/, "numbers"),
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
            ownerId: Joi.string()
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
        },
    },
};

export const store: object = {
    payload: {
        transactions: Joi.arkTransactionArray()
            .min(1)
            .max(app.resolveOptions("transactionPool").maxTransactionsPerRequest)
            .options({ stripUnknown: true }),
    },
};

export const show: object = {
    params: {
        id: Joi.string()
            .hex()
            .length(64),
    },
};

export const unconfirmed: object = {
    query: pagination,
};

export const showUnconfirmed: object = {
    params: {
        id: Joi.string()
            .hex()
            .length(64),
    },
};

export const search: object = {
    query: pagination,
    payload: {
        orderBy: Joi.string(),
        id: Joi.string()
            .hex()
            .length(64),
        blockId: Joi.string().regex(/^[0-9]+$/, "numbers"),
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
        ownerId: Joi.string()
            .alphanum()
            .length(34),
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
    },
};
