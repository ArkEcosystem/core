import Hapi from "hapi";
import { WalletsController } from "./controller";
import * as Schema from "./schema";

export function registerRoutes(server: Hapi.Server): void {
    const controller = new WalletsController();
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/wallets",
        options: {
            handler: controller.index,
            validate: Schema.index,
        },
    });

    server.route({
        method: "GET",
        path: "/wallets/top",
        handler: controller.top,
        options: {
            validate: Schema.index,
        },
    });

    server.route({
        method: "GET",
        path: "/wallets/{id}",
        handler: controller.show,
        options: {
            validate: Schema.index,
        },
    });

    server.route({
        method: "GET",
        path: "/wallets/{id}/transactions",
        handler: controller.transactions,
        options: {
            validate: Schema.index,
        },
    });

    server.route({
        method: "GET",
        path: "/wallets/{id}/transactions/sent",
        handler: controller.transactionsSent,
        options: {
            validate: Schema.index,
        },
    });

    server.route({
        method: "GET",
        path: "/wallets/{id}/transactions/received",
        handler: controller.transactionsReceived,
        options: {
            validate: Schema.index,
        },
    });

    server.route({
        method: "GET",
        path: "/wallets/{id}/votes",
        handler: controller.votes,
        options: {
            validate: Schema.index,
        },
    });

    server.route({
        method: "POST",
        path: "/wallets/search",
        handler: controller.search,
        options: {
            validate: Schema.index,
        },
    });
}
