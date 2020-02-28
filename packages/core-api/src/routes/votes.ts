import Hapi from "@hapi/hapi";
import Joi from "@hapi/joi";

import { VotesController } from "../controllers/votes";

export const register = (server: Hapi.Server): void => {
    const controller = server.app.app.resolve(VotesController);
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/votes",
        handler: controller.index,
        options: {
            validate: {
                query: Joi.object({
                    ...server.app.schemas.pagination,
                    ...{
                        orderBy: server.app.schemas.orderBy,
                        id: Joi.string()
                            .hex()
                            .length(64),
                        blockId: server.app.schemas.blockId,
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
                        amount: Joi.number()
                            .integer()
                            .min(0),
                        fee: Joi.number()
                            .integer()
                            .min(0),
                        vendorField: Joi.string().max(255, "utf8"),
                        transform: Joi.bool().default(true),
                    },
                }),
            },
        },
    });

    server.route({
        method: "GET",
        path: "/votes/{id}",
        handler: controller.show,
        options: {
            validate: {
                params: Joi.object({
                    id: Joi.string()
                        .hex()
                        .length(64),
                }),
                query: Joi.object({
                    transform: Joi.bool().default(true),
                }),
            },
        },
    });
};
