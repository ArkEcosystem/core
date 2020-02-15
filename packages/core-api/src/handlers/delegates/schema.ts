import { app } from "@arkecosystem/core-container";
import Joi from "@hapi/joi";
import { blockIteratees, delegateIteratees, walletIteratees } from "../shared/iteratees";
import { address, blockId, orderBy, pagination, publicKey, username, walletId } from "../shared/schemas";

const config = app.getConfig();

const schemaIntegerBetween = Joi.object().keys({
    from: Joi.number()
        .integer()
        .min(0),
    to: Joi.number()
        .integer()
        .min(0),
});

const schemaPercentage = Joi.object().keys({
    from: Joi.number()
        .precision(2)
        .min(0)
        .max(100),
    to: Joi.number()
        .precision(2)
        .min(0)
        .max(100),
});

export const index: object = {
    query: {
        ...pagination,
        ...{
            orderBy: orderBy(delegateIteratees),
            type: Joi.string().valid("resigned", "never-forged"),
            address,
            publicKey,
            secondPublicKey: publicKey,
            vote: publicKey,
            username,
            balance: Joi.number()
                .integer()
                .min(0),
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

export const search: object = {
    query: {
        ...pagination,
        ...{
            orderBy: orderBy(delegateIteratees),
        },
    },
    payload: {
        address,
        publicKey,
        username,
        usernames: Joi.array()
            .unique()
            .min(1)
            .max(config.getMilestone().activeDelegates)
            .items(username),
        approval: schemaPercentage,
        forgedFees: schemaIntegerBetween,
        forgedRewards: schemaIntegerBetween,
        forgedTotal: schemaIntegerBetween,
        producedBlocks: schemaIntegerBetween,
        voteBalance: schemaIntegerBetween,
    },
};

export const blocks: object = {
    params: {
        id: walletId,
    },
    query: {
        ...pagination,
        ...{
            orderBy: orderBy(blockIteratees),
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
                .min(0),
            payloadHash: Joi.string().hex(),
            generatorPublicKey: publicKey,
            blockSignature: Joi.string().hex(),
            transform: Joi.bool().default(true),
        },
    },
};

export const voters: object = {
    params: {
        id: walletId,
    },
    query: {
        ...pagination,
        ...{
            orderBy: orderBy(walletIteratees),
            address,
            publicKey,
            secondPublicKey: publicKey,
            vote: publicKey,
            username,
            balance: Joi.number()
                .integer()
                .min(0),
            voteBalance: Joi.number()
                .integer()
                .min(0),
            producedBlocks: Joi.number()
                .integer()
                .min(0),
            transform: Joi.bool().default(true),
        },
    },
};
