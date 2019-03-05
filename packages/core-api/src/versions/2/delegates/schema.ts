import { app } from "@arkecosystem/core-container";
import * as Joi from "joi";
import { pagination } from "../shared/schemas/pagination";

const config = app.getConfig();

const schemaIdentifier = Joi.string()
    .regex(/^[a-zA-Z0-9!@$&_.]+$/)
    .min(1)
    .max(66);

const schemaUsername = Joi.string()
    .regex(/^[a-z0-9!@$&_.]+$/)
    .min(1)
    .max(20);

const schemaIntegerBetween = Joi.object()
    .keys({
        from: Joi
            .number()
            .integer()
            .min(0),
        to: Joi
            .number()
            .integer()
            .min(0),
    })

const schemaPercentage = Joi.object()
    .keys({
        from: Joi
            .number()
            .precision(2)
            .min(0)
            .max(100),
        to: Joi
            .number()
            .precision(2)
            .min(0)
            .max(100),
    })

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
            username: schemaUsername,
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
        id: schemaIdentifier,
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
        address: Joi.string()
            .alphanum()
            .length(34),
        publicKey: Joi.string()
            .hex()
            .length(66),
        username: schemaUsername,
        usernames: Joi.array()
            .unique()
            .min(1)
            .max(config.getMilestone().activeDelegates)
            .items(schemaUsername),
        approval: schemaPercentage,
        forgedFees: schemaIntegerBetween,
        forgedRewards: schemaIntegerBetween,
        forgedTotal: schemaIntegerBetween,
        missedBlocks: schemaIntegerBetween,
        producedBlocks: schemaIntegerBetween,
        productivity: schemaPercentage,
        voteBalance: schemaIntegerBetween,
    },
};

export const blocks: object = {
    params: {
        id: schemaIdentifier,
    },
    query: {
        ...pagination,
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
        id: schemaIdentifier,
    },
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
            username: schemaUsername,
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
        id: schemaIdentifier,
    },
};
