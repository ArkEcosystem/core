import Hapi from "@hapi/hapi";
import { BlocksController } from "./controller";
import * as Schema from "./schema";

export const registerRoutes = (server: Hapi.Server): void => {
    const controller = new BlocksController();
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/blocks",
        handler: controller.index,
        options: {
            plugins: {
                "hapi-ajv": {
                    querySchema: Schema.getBlocks,
                },
            },
        },
    });

    server.route({
        method: "GET",
        path: "/blocks/get",
        handler: controller.show,
        options: {
            plugins: {
                "hapi-ajv": {
                    querySchema: Schema.getBlock,
                },
            },
        },
    });

    server.route({
        method: "GET",
        path: "/blocks/getEpoch",
        handler: controller.epoch,
    });

    server.route({
        method: "GET",
        path: "/blocks/getHeight",
        handler: controller.height,
    });

    server.route({
        method: "GET",
        path: "/blocks/getheight",
        handler: controller.height,
    });

    server.route({
        method: "GET",
        path: "/blocks/getNethash",
        handler: controller.nethash,
    });

    server.route({
        method: "GET",
        path: "/blocks/getFee",
        handler: controller.fee,
    });

    server.route({
        method: "GET",
        path: "/blocks/getFees",
        handler: controller.fees,
    });

    server.route({
        method: "GET",
        path: "/blocks/getfees",
        handler: controller.fees,
    });

    server.route({
        method: "GET",
        path: "/blocks/getMilestone",
        handler: controller.milestone,
    });

    server.route({
        method: "GET",
        path: "/blocks/getReward",
        handler: controller.reward,
    });

    server.route({
        method: "GET",
        path: "/blocks/getSupply",
        handler: controller.supply,
    });

    server.route({
        method: "GET",
        path: "/blocks/getStatus",
        handler: controller.status,
    });
};
