import Joi from "@hapi/joi";
import { blockId } from "../shared/schemas/block-id";
import { pagination } from "../shared/schemas/pagination";

export const index: object = {
    query: {
        ...pagination,
        ...{
            orderBy: Joi.string(),
            id: blockId,
            version: Joi.number()
                .integer()
                .min(0),
            timestamp: Joi.number()
                .integer()
                .min(0),
            previousBlock: blockId,
            height: Joi.number()
                .integer()
                .positive(),
            numberOfTransactions: Joi.number()
                .integer()
                .min(0),
            totalAmount: Joi.number()
                .integer()
                .min(0),
            totalFee: Joi.number()
                .integer()
                .min(0),
            reward: Joi.number()
                .integer()
                .min(0),
            payloadLength: Joi.number()
                .integer()
                .positive(),
            payloadHash: Joi.string().hex(),
            generatorPublicKey: Joi.string()
                .hex()
                .length(66),
            blockSignature: Joi.string().hex(),
            transform: Joi.bool().default(true),
        },
    },
};

export const show: object = {
    params: {
        id: blockId,
    },
    query: {
        transform: Joi.bool().default(true),
    },
};

export const transactions: object = {
    params: {
        id: Joi.string(),
    },
    query: {
        ...pagination,
        ...{
            orderBy: Joi.string(),
            id: Joi.string()
                .hex()
                .length(66),
            blockId,
            type: Joi.number()
                .integer()
                .min(0),
            version: Joi.number()
                .integer()
                .min(0),
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

export const search: object = {
    query: {
        ...pagination,
        ...{
            transform: Joi.bool().default(true),
        },
    },
    payload: {
        id: blockId,
        version: Joi.number()
            .integer()
            .min(0),
        previousBlock: blockId,
        payloadHash: Joi.string().hex(),
        generatorPublicKey: Joi.string()
            .hex()
            .length(66),
        blockSignature: Joi.string().hex(),
        timestamp: Joi.object().keys({
            from: Joi.number()
                .integer()
                .min(0),
            to: Joi.number()
                .integer()
                .min(0),
        }),
        height: Joi.object().keys({
            from: Joi.number()
                .integer()
                .positive(),
            to: Joi.number()
                .integer()
                .positive(),
        }),
        numberOfTransactions: Joi.object().keys({
            from: Joi.number()
                .integer()
                .min(0),
            to: Joi.number()
                .integer()
                .min(0),
        }),
        totalAmount: Joi.object().keys({
            from: Joi.number()
                .integer()
                .min(0),
            to: Joi.number()
                .integer()
                .min(0),
        }),
        totalFee: Joi.object().keys({
            from: Joi.number()
                .integer()
                .min(0),
            to: Joi.number()
                .integer()
                .min(0),
        }),
        reward: Joi.object().keys({
            from: Joi.number()
                .integer()
                .min(0),
            to: Joi.number()
                .integer()
                .min(0),
        }),
        payloadLength: Joi.object().keys({
            from: Joi.number()
                .integer()
                .min(0),
            to: Joi.number()
                .integer()
                .min(0),
        }),
    },
};
