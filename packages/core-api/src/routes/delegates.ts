import { Managers } from "@arkecosystem/crypto";
import Hapi from "@hapi/hapi";
import Joi from "@hapi/joi";

import { DelegatesController } from "../controllers/delegates";

export const register = (server: Hapi.Server): void => {
    const controller = server.app.app.resolve(DelegatesController);
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/delegates",
        handler: controller.index,
        options: {
            validate: {
                query: Joi.object({
                    ...server.app.schemas.pagination,
                    ...{
                        orderBy: server.app.schemas.orderBy,
                        type: Joi.string().valid("resigned", "never-forged"),
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
                        username: server.app.schemas.username,
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
                }),
            },
        },
    });

    server.route({
        method: "GET",
        path: "/delegates/{id}",
        handler: controller.show,
        options: {
            validate: {
                params: Joi.object({
                    id: server.app.schemas.delegateIdentifier,
                }),
            },
        },
    });

    server.route({
        method: "GET",
        path: "/delegates/{id}/blocks",
        handler: controller.blocks,
        options: {
            validate: {
                params: Joi.object({
                    id: server.app.schemas.delegateIdentifier,
                }),
                query: Joi.object({
                    ...server.app.schemas.pagination,
                    ...{
                        orderBy: server.app.schemas.orderBy,
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
                        username: server.app.schemas.username,
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
                }),
            },
        },
    });

    server.route({
        method: "GET",
        path: "/delegates/{id}/voters",
        handler: controller.voters,
        options: {
            validate: {
                params: Joi.object({
                    id: server.app.schemas.delegateIdentifier,
                }),
                query: Joi.object({
                    ...server.app.schemas.pagination,
                    ...{
                        orderBy: server.app.schemas.orderBy,
                        id: server.app.schemas.blockId,
                        version: Joi.number()
                            .integer()
                            .min(0),
                        timestamp: Joi.number()
                            .integer()
                            .min(0),
                        previousBlock: server.app.schemas.blockId,
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
                        transform: Joi.bool().default(true),
                    },
                }),
            },
        },
    });

    server.route({
        method: "POST",
        path: "/delegates/search",
        handler: controller.search,
        options: {
            validate: {
                query: Joi.object({
                    ...server.app.schemas.pagination,
                    ...{
                        orderBy: server.app.schemas.orderBy,
                    },
                }),
                payload: Joi.object({
                    address: Joi.string()
                        .alphanum()
                        .length(34),
                    publicKey: Joi.string()
                        .hex()
                        .length(66),
                    username: server.app.schemas.username,
                    usernames: Joi.array()
                        .unique()
                        .min(1)
                        .max(Managers.configManager.getMilestone().activeDelegates)
                        .items(server.app.schemas.username),
                    approval: server.app.schemas.percentage,
                    forgedFees: server.app.schemas.integerBetween,
                    forgedRewards: server.app.schemas.integerBetween,
                    forgedTotal: server.app.schemas.integerBetween,
                    producedBlocks: server.app.schemas.integerBetween,
                    voteBalance: server.app.schemas.integerBetween,
                }),
            },
        },
    });
};
