"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_http_utils_1 = require("@arkecosystem/core-http-utils");
const boom_1 = __importDefault(require("@hapi/boom"));
const crypto_1 = require("crypto");
const database_1 = require("../database");
const schema = __importStar(require("./schema"));
const utils = __importStar(require("./utils"));
exports.startServer = async (config) => {
    const server = await core_http_utils_1.createServer({
        host: config.host,
        port: config.port,
        routes: {
            cors: true,
        },
    });
    await server.register({
        plugin: core_http_utils_1.plugins.whitelist,
        options: {
            whitelist: config.whitelist,
        },
    });
    server.route({
        method: "GET",
        path: "/api/webhooks",
        handler: () => {
            return {
                data: database_1.database.all().map(webhook => {
                    webhook = { ...webhook };
                    delete webhook.token;
                    return webhook;
                }),
            };
        },
    });
    server.route({
        method: "POST",
        path: "/api/webhooks",
        handler(request, h) {
            const token = crypto_1.randomBytes(32).toString("hex");
            return h
                .response(utils.respondWithResource({
                ...database_1.database.create({
                    ...request.payload,
                    ...{ token: token.substring(0, 32) },
                }),
                ...{ token },
            }))
                .code(201);
        },
        options: {
            plugins: {
                pagination: {
                    enabled: false,
                },
            },
            validate: schema.store,
        },
    });
    server.route({
        method: "GET",
        path: "/api/webhooks/{id}",
        async handler(request) {
            if (!database_1.database.hasById(request.params.id)) {
                return boom_1.default.notFound();
            }
            const webhook = { ...database_1.database.findById(request.params.id) };
            delete webhook.token;
            return utils.respondWithResource(webhook);
        },
        options: {
            validate: schema.show,
        },
    });
    server.route({
        method: "PUT",
        path: "/api/webhooks/{id}",
        handler: (request, h) => {
            if (!database_1.database.hasById(request.params.id)) {
                return boom_1.default.notFound();
            }
            database_1.database.update(request.params.id, request.payload);
            return h.response(undefined).code(204);
        },
        options: {
            validate: schema.update,
        },
    });
    server.route({
        method: "DELETE",
        path: "/api/webhooks/{id}",
        handler: (request, h) => {
            if (!database_1.database.hasById(request.params.id)) {
                return boom_1.default.notFound();
            }
            database_1.database.destroy(request.params.id);
            return h.response(undefined).code(204);
        },
        options: {
            validate: schema.destroy,
        },
    });
    return core_http_utils_1.mountServer("Webhook API", server);
};
//# sourceMappingURL=index.js.map