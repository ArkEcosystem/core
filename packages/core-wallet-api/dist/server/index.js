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
const core_container_1 = require("@arkecosystem/core-container");
const core_http_utils_1 = require("@arkecosystem/core-http-utils");
const h2o2_1 = __importDefault(require("@hapi/h2o2"));
const handlers = __importStar(require("./handlers"));
exports.startServer = async (config) => {
    const server = await core_http_utils_1.createServer({
        host: config.host,
        port: config.port,
    });
    // @ts-ignore
    await server.register(h2o2_1.default);
    await server.register({
        plugin: core_http_utils_1.plugins.corsHeaders,
    });
    server.route({
        method: "GET",
        path: "/",
        handler() {
            return { data: "Hello World!" };
        },
    });
    server.route([{ method: "GET", path: "/config", ...handlers.config }]);
    if (core_container_1.app.has("api")) {
        await server.register({
            plugin: require("hapi-rate-limit"),
            options: core_container_1.app.resolveOptions("api").rateLimit,
        });
        await server.register({
            plugin: core_http_utils_1.plugins.whitelist,
            options: {
                whitelist: core_container_1.app.resolveOptions("api").whitelist,
            },
        });
        server.route({
            method: "*",
            path: "/{path*}",
            handler: {
                proxy: {
                    protocol: "http",
                    host: core_container_1.app.resolveOptions("api").host,
                    port: core_container_1.app.resolveOptions("api").port,
                    passThrough: true,
                },
            },
        });
    }
    return core_http_utils_1.mountServer("Wallet API", server);
};
//# sourceMappingURL=index.js.map