import * as Joi from "joi";
import * as Pagination from "../shared/schemas/pagination";

export const index: object = {
    query: {
        ...Pagination,
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
        ...Pagination,
        orderBy: Joi.string(),
    },
};

export const transactionsSent: object = {
    params: {
        id: Joi.string(),
    },
    query: {
        ...Pagination,
        orderBy: Joi.string(),
    },
};

export const transactionsReceived: object = {
    params: {
        id: Joi.string(),
    },
    query: {
        ...Pagination,
        orderBy: Joi.string(),
    },
};

export const votes: object = {
    params: {
        id: Joi.string(),
    },
    query: Pagination,
};

export const search: object = {
    query: Pagination,
    payload: {
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
