"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const controller_1 = require("./controller");
const Schema = __importStar(require("./schema"));
exports.registerRoutes = (server) => {
    const controller = new controller_1.NodeController();
    server.bind(controller);
    server.route({
        method: "GET",
        path: "/node/status",
        handler: controller.status,
    });
    server.route({
        method: "GET",
        path: "/node/syncing",
        handler: controller.syncing,
    });
    server.route({
        method: "GET",
        path: "/node/configuration",
        handler: controller.configuration,
    });
    server.route({
        method: "GET",
        path: "/node/configuration/crypto",
        handler: controller.configurationCrypto,
    });
    server.route({
        method: "GET",
        path: "/node/fees",
        handler: controller.fees,
        options: {
            validate: Schema.fees,
        },
    });
    if (core_container_1.app.getConfig().get("network.name") === "testnet" || process.env.CORE_API_DEBUG_ENDPOINT_ENABLED) {
        server.route({
            method: "GET",
            path: "/node/debug",
            handler: controller.debug,
            options: {
                validate: Schema.debug,
            },
        });
    }
};
//# sourceMappingURL=routes.js.map