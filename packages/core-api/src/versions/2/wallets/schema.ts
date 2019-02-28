import * as Joi from "joi";
import { blockId } from "../shared/schemas/block-id";
import { pagination } from "../shared/schemas/pagination";

export const index: object = {
    query: {
        ...pagination,
        ...{
            orderBy: Joi.string(),
            address: Joi.string()
                .alphanum()
                .length(34),
            publicKey: Joi.string()
                .hex()
                .length(66),
            secondPublicKey: Joi.string()
                .hex()
                .length(66),
            vote: Joi.string()
                .hex()
                .length(66),
            username: Joi.string(),
            balance: Joi.number().integer(),
            voteBalance: Joi.number()
                .integer()
                .min(0),
            producedBlocks: Joi.number()
                .integer()
                .min(0),
            missedBlocks: Joi.number()
                .integer()
                .min(0),
        },
    },
};

export const show: object = {
    params: {
        id: Joi.string(),
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

export const transactionsSent: object = {
    params: {
        id: Joi.string(),
    },
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

export const transactionsReceived: object = {
    params: {
        id: Joi.string(),
    },
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

export const votes: object = {
    params: {
        id: Joi.string(),
    },
    query: pagination,
};

const address: object = Joi.string()
    .alphanum()
    .length(34);

export const search: object = {
    query: pagination,
    payload: {
        orderBy: Joi.string(),
        address,
        addresses: Joi.array()
            .unique()
            .min(1)
            .max(50)
            .items(address),
        publicKey: Joi.string()
            .hex()
            .length(66),
        secondPublicKey: Joi.string()
            .hex()
            .length(66),
        vote: Joi.string()
            .hex()
            .length(66),
        username: Joi.string(),
        producedBlocks: Joi.number()
            .integer()
            .min(0),
        missedBlocks: Joi.number()
            .integer()
            .min(0),
        balance: Joi.object().keys({
            from: Joi.number().integer(),
            to: Joi.number().integer(),
        }),
        voteBalance: Joi.object().keys({
            from: Joi.number()
                .integer()
                .min(0),
            to: Joi.number()
                .integer()
                .min(0),
        }),
    },
};
