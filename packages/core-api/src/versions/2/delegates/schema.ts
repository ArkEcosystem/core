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
            balance: Joi.number()
                .integer()
                .min(0),
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

export const search: object = {
    query: Pagination,
    payload: {
        username: Joi.string(),
    },
};

export const blocks: object = {
    params: {
        id: Joi.string(),
    },
    query: {
        ...Pagination,
        ...{
            orderBy: Joi.string(),
            id: Joi.string().regex(/^[0-9]+$/, "numbers"),
            version: Joi.number()
                .integer()
                .min(0),
            timestamp: Joi.number()
                .integer()
                .min(0),
            previousBlock: Joi.string().regex(/^[0-9]+$/, "numbers"),
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
                .min(0),
            payloadHash: Joi.string().hex(),
            generatorPublicKey: Joi.string()
                .hex()
                .length(66),
            blockSignature: Joi.string().hex(),
        },
    },
};

export const voters: object = {
    params: {
        id: Joi.string(),
    },
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
            balance: Joi.number()
                .integer()
                .min(0),
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

export const voterBalances: object = {
    params: {
        id: Joi.string(),
    },
};
