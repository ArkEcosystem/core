import Hapi from "@hapi/hapi";
import { TransactionsController } from "./controller";
import * as Schema from "./schema";

export function registerRoutes(server: Hapi.Server): void {
    const controller = new TransactionsController();
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/transactions",
        handler: controller.index,
        options: {
            plugins: {
                "hapi-ajv": {
                    querySchema: Schema.getTransactions,
                },
            },
        },
    });

    server.route({
        method: "GET",
        path: "/transactions/get",
        handler: controller.show,
        options: {
            plugins: {
                "hapi-ajv": {
                    querySchema: Schema.getTransaction,
                },
            },
        },
    });

    server.route({
        method: "GET",
        path: "/transactions/unconfirmed",
        handler: controller.unconfirmed,
    });

    server.route({
        method: "GET",
        path: "/transactions/unconfirmed/get",
        handler: controller.showUnconfirmed,
    });
}
