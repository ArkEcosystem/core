import Joi from "@hapi/joi";
import { lockIteratees, transactionIteratees, walletIteratees } from "../shared/iteratees";
import { address, blockId, orderBy, pagination, publicKey, username, walletId } from "../shared/schemas";

export const index: object = {
    query: {
        ...pagination,
        ...{
            orderBy: orderBy(walletIteratees),
            address,
            publicKey,
            secondPublicKey: publicKey,
            vote: publicKey,
            username,
            balance: Joi.number().integer(),
            voteBalance: Joi.number()
                .integer()
                .min(0),
            producedBlocks: Joi.number()
                .integer()
                .min(0),
        },
    },
};

export const show: object = {
    params: {
        id: walletId,
    },
};

export const transactions: object = {
    params: {
        id: walletId,
    },
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

export const transactionsSent: object = {
    params: {
        id: walletId,
    },
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

export const transactionsReceived: object = {
    params: {
        id: walletId,
    },
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

export const votes: object = {
    params: {
        id: walletId,
    },
    query: {
        ...pagination,
        ...{
            transform: Joi.bool().default(true),
        },
    },
};

export const locks: object = {
    params: {
        id: walletId,
    },
    query: {
        ...pagination,
        ...{
            isExpired: Joi.bool(),
            orderBy: orderBy(lockIteratees),
        },
    },
};

export const search: object = {
    query: {
        ...pagination,
        ...{
            orderBy: orderBy(walletIteratees),
        },
    },
    payload: {
        address,
        addresses: Joi.array()
            .unique()
            .min(1)
            .max(50)
            .items(address),
        publicKey,
        secondPublicKey: publicKey,
        vote: publicKey,
        username,
        producedBlocks: Joi.number()
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
        lockedBalance: Joi.object().keys({
            from: Joi.number()
                .integer()
                .min(0),
            to: Joi.number()
                .integer()
                .min(0),
        }),
    },
};
