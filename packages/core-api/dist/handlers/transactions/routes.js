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
    const controller = new controller_1.TransactionsController();
    server.bind(controller);
    server.route({
        method: "GET",
        path: "/transactions",
        handler: controller.index,
        options: {
            validate: Schema.index,
        },
    });
    server.route({
        method: "POST",
        path: "/transactions",
        handler: controller.store,
        options: {
            plugins: {
                "hapi-ajv": {
                    payloadSchema: Schema.store,
                },
            },
        },
    });
    server.route({
        method: "GET",
        path: "/transactions/{id}",
        handler: controller.show,
        options: {
            validate: Schema.show,
        },
    });
    server.route({
        method: "GET",
        path: "/transactions/unconfirmed",
        handler: controller.unconfirmed,
        options: {
            validate: Schema.unconfirmed,
        },
    });
    server.route({
        method: "GET",
        path: "/transactions/unconfirmed/{id}",
        handler: controller.showUnconfirmed,
        options: {
            validate: Schema.showUnconfirmed,
        },
    });
    server.route({
        method: "POST",
        path: "/transactions/search",
        handler: controller.search,
        options: {
            validate: Schema.search,
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
//# sourceMappingURL=routes.js.map