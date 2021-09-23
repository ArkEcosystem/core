"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const controller_1 = require("./controller");
const Schema = __importStar(require("./schema"));
exports.registerRoutes = (server) => {
    const controller = new controller_1.WalletsController();
    server.bind(controller);
    server.route({
        method: "GET",
        path: "/wallets",
        handler: controller.index,
        options: {
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
            validate: Schema.show,
        },
    });
    server.route({
        method: "GET",
        path: "/wallets/{id}/transactions",
        handler: controller.transactions,
        options: {
            validate: Schema.transactions,
        },
    });
    server.route({
        method: "GET",
        path: "/wallets/{id}/transactions/sent",
        handler: controller.transactionsSent,
        options: {
            validate: Schema.transactionsSent,
        },
    });
    server.route({
        method: "GET",
        path: "/wallets/{id}/transactions/received",
        handler: controller.transactionsReceived,
        options: {
            validate: Schema.transactionsReceived,
        },
    });
    server.route({
        method: "GET",
        path: "/wallets/{id}/votes",
        handler: controller.votes,
        options: {
            validate: Schema.votes,
        },
    });
    server.route({
        method: "GET",
        path: "/wallets/{id}/locks",
        handler: controller.locks,
        options: {
            validate: Schema.locks,
        },
    });
    server.route({
        method: "POST",
        path: "/wallets/search",
        handler: controller.search,
        options: {
            validate: Schema.search,
        },
    });
};
//# sourceMappingURL=routes.js.map