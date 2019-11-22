import { Container, Providers } from "@arkecosystem/core-kernel";
import Hapi from "@hapi/hapi";
import Joi from "@hapi/joi";

import { TransactionsController } from "../controllers/transactions";
import { numberFixedOrBetween, orderBy, searchCriteria } from "../schemas";

export const register = (server: Hapi.Server): void => {
    const controller = server.app.app.resolve(TransactionsController);
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/transactions",
        handler: controller.index,
        options: {
            validate: {
                query: {
                    ...server.app.schemas.pagination,
                    ...{
                        orderBy,
                        id: Joi.string()
                            .hex()
                            .length(64),
                        blockId: server.app.schemas.blockId,
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
            },
        },
    });

    server.route({
        method: "POST",
        path: "/transactions",
        handler: controller.store,
        options: {
            plugins: {
                "hapi-ajv": {
                    payloadSchema: {
                        type: "object",
                        required: ["transactions"],
                        additionalProperties: false,
                        properties: {
                            transactions: {
                                $ref: "transactions",
                                minItems: 1,
                                maxItems: server.app.app
                                    .get<Providers.ServiceProviderRepository>(
                                        Container.Identifiers.ServiceProviderRepository,
                                    )
                                    .get("transactionPool")
                                    .config()
                                    .get<number>("maxTransactionsPerRequest"),
                            },
                        },
                    },
                },
            },
        },
    });

    server.route({
        method: "GET",
        path: "/transactions/{id}",
        handler: controller.show,
        options: {
            validate: {
                params: {
                    id: Joi.string()
                        .hex()
                        .length(64),
                },
                query: {
                    transform: Joi.bool().default(true),
                },
            },
        },
    });

    server.route({
        method: "GET",
        path: "/transactions/unconfirmed",
        handler: controller.unconfirmed,
        options: {
            validate: {
                query: {
                    ...server.app.schemas.pagination,
                    ...{
                        transform: Joi.bool().default(true),
                    },
                },
            },
        },
    });

    server.route({
        method: "GET",
        path: "/transactions/unconfirmed/{id}",
        handler: controller.showUnconfirmed,
        options: {
            validate: {
                params: {
                    id: Joi.string()
                        .hex()
                        .length(64),
                },
            },
        },
    });

    server.route({
        method: "POST",
        path: "/transactions/search",
        handler: controller.search,
        options: {
            validate: {
                query: {
                    ...server.app.schemas.pagination,
                    ...{
                        transform: Joi.bool().default(true),
                    },
                },
                payload: {
                    orderBy,
                    limit: Joi.number().min(0),
                    offset: Joi.number().min(0),
                    criteria: Joi.array().items(
                        searchCriteria(
                            "id",
                            Joi.string()
                                .hex()
                                .length(64),
                            ["equal", "in", "like"],
                        ),
                        searchCriteria("blockId", server.app.schemas.blockId, ["equal", "in", "like"]),
                        searchCriteria(
                            "type",
                            Joi.number()
                                .integer()
                                .min(0),
                            ["equal", "in", "like", "lessThanEqual", "greaterThanEqual"],
                        ),
                        searchCriteria(
                            "typeGroup",
                            Joi.number()
                                .integer()
                                .min(0),
                            ["equal", "in", "like", "lessThanEqual", "greaterThanEqual"],
                        ),
                        searchCriteria(
                            "version",
                            Joi.number()
                                .integer()
                                .positive(),
                            ["equal", "in", "like", "lessThanEqual", "greaterThanEqual"],
                        ),
                        searchCriteria(
                            "senderPublicKey",
                            Joi.string()
                                .hex()
                                .length(66),
                            ["equal", "in", "like"],
                        ),
                        searchCriteria(
                            "senderId",
                            Joi.alternatives(
                                server.app.schemas.address,
                                Joi.array()
                                    .unique()
                                    .min(1)
                                    .max(50)
                                    .items(server.app.schemas.address),
                            ),
                            ["equal", "in", "like"],
                        ),
                        searchCriteria(
                            "recipientId",
                            Joi.alternatives(
                                server.app.schemas.address,
                                Joi.array()
                                    .unique()
                                    .min(1)
                                    .max(50)
                                    .items(server.app.schemas.address),
                            ),
                            ["equal", "in", "like"],
                        ),
                        searchCriteria("vendorField", Joi.string().max(255, "utf8"), ["equal", "in", "like"]),
                        searchCriteria("nonce", numberFixedOrBetween, [
                            "between",
                            "equal",
                            "in",
                            "like",
                            "lessThanEqual",
                            "greaterThanEqual",
                        ]),
                        searchCriteria("amount", numberFixedOrBetween, [
                            "between",
                            "equal",
                            "in",
                            "like",
                            "lessThanEqual",
                            "greaterThanEqual",
                        ]),
                        searchCriteria("fee", numberFixedOrBetween, [
                            "between",
                            "equal",
                            "in",
                            "like",
                            "lessThanEqual",
                            "greaterThanEqual",
                        ]),
                        searchCriteria("timestamp", numberFixedOrBetween, [
                            "between",
                            "equal",
                            "in",
                            "like",
                            "lessThanEqual",
                            "greaterThanEqual",
                        ]),
                        searchCriteria("asset", Joi.object(), ["contains"]),
                    ),
                },
            },
        },
    });

    server.route({
        method: "GET",
        path: "/transactions/types",
        handler: controller.types,
    });

    server.route({
        method: "GET",
        path: "/transactions/schemas",
        handler: controller.schemas,
    });

    server.route({
        method: "GET",
        path: "/transactions/fees",
        handler: controller.fees,
    });
};
