import Joi from "@hapi/joi";
import { blockId } from "../shared/schemas/block-id";
import { pagination } from "../shared/schemas/pagination";
import { walletId } from "../shared/schemas/wallet-id";

const address: object = Joi.string()
    .alphanum()
    .length(34);

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
            orderBy: Joi.string(),
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
            orderBy: Joi.string(),
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
            recipientId: Joi.string()
                .alphanum()
                .length(34),
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
            orderBy: Joi.string(),
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
            senderPublicKey: Joi.string()
                .hex()
                .length(66),
            senderId: Joi.string()
                .alphanum()
                .length(34),
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
            orderBy: Joi.string(),
        },
    },
};

export const search: object = {
    query: {
        ...pagination,
        ...{
            orderBy: Joi.string(),
        },
    },
    payload: {
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
