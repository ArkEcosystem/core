import Hapi from "@hapi/hapi";
import { AccountsController } from "./controller";
import * as Schema from "./schema";

export const registerRoutes = (server: Hapi.Server): void => {
    const controller = new AccountsController();
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/accounts/getAllAccounts",
        handler: controller.index,
    });

    server.route({
        method: "GET",
        path: "/accounts",
        handler: controller.show,
        options: {
            plugins: {
                "hapi-ajv": {
                    querySchema: Schema.getAccount,
                },
            },
        },
    });

    server.route({
        method: "GET",
        path: "/accounts/getBalance",
        handler: controller.balance,
        options: {
            plugins: {
                "hapi-ajv": {
                    querySchema: Schema.getBalance,
                },
            },
        },
    });

    server.route({
        method: "GET",
        path: "/accounts/getPublicKey",
        handler: controller.publicKey,
        options: {
            plugins: {
                "hapi-ajv": {
                    querySchema: Schema.getPublicKey,
                },
            },
        },
    });

    server.route({
        method: "GET",
        path: "/accounts/delegates/fee",
        handler: controller.fee,
    });

    server.route({
        method: "GET",
        path: "/accounts/delegates",
        handler: controller.delegates,
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
        path: "/accounts/top",
        handler: controller.top,
        options: {
            plugins: {
                "hapi-ajv": {
                    querySchema: Schema.top,
                },
            },
        },
    });

    server.route({
        method: "GET",
        path: "/accounts/count",
        handler: controller.count,
    });
};
