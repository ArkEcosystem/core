import Hapi from "@hapi/hapi";
import { DelegatesController } from "./controller";
import * as Schema from "./schema";

export function registerRoutes(server: Hapi.Server): void {
    const controller = new DelegatesController();
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/delegates",
        handler: controller.index,
        options: {
            plugins: {
                "hapi-ajv": {
                    querySchema: Schema.getDelegates,
                },
            },
        },
    });

    server.route({
        method: "GET",
        path: "/delegates/get",
        handler: controller.show,
        options: {
            plugins: {
                "hapi-ajv": {
                    querySchema: Schema.getDelegate,
                },
            },
        },
    });

    server.route({
        method: "GET",
        path: "/delegates/count",
        handler: controller.count,
    });

    server.route({
        method: "GET",
        path: "/delegates/search",
        handler: controller.search,
        options: {
            plugins: {
                "hapi-ajv": {
                    querySchema: Schema.search,
                },
            },
        },
    });

    server.route({
        method: "GET",
        path: "/delegates/voters",
        handler: controller.voters,
        options: {
            plugins: {
                "hapi-ajv": {
                    querySchema: Schema.getVoters,
                },
            },
        },
    });

    server.route({
        method: "GET",
        path: "/delegates/fee",
        handler: controller.fee,
    });

    server.route({
        method: "GET",
        path: "/delegates/forging/getForgedByAccount",
        handler: controller.forged,
        options: {
            plugins: {
                "hapi-ajv": {
                    querySchema: Schema.getForgedByAccount,
                },
            },
        },
    });

    server.route({
        method: "GET",
        path: "/delegates/getNextForgers",
        handler: controller.nextForgers,
    });
}
