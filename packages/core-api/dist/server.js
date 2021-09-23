"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const core_http_utils_1 = require("@arkecosystem/core-http-utils");
const dottie_1 = require("dottie");
class Server {
    constructor(config) {
        this.config = config;
        this.logger = core_container_1.app.resolvePlugin("logger");
    }
    async start() {
        const options = {
            host: this.config.host,
            port: this.config.port,
        };
        if (this.config.enabled) {
            this.http = await core_http_utils_1.createServer(options);
            this.http.app.config = this.config;
            this.registerPlugins("HTTP", this.http);
        }
        if (this.config.ssl.enabled) {
            this.https = await core_http_utils_1.createServer({
                ...options,
                ...{ host: this.config.ssl.host, port: this.config.ssl.port },
                ...{ tls: { key: this.config.ssl.key, cert: this.config.ssl.cert } },
            });
            this.https.app.config = this.config;
            this.registerPlugins("HTTPS", this.https);
        }
    }
    async stop() {
        if (this.http) {
            this.logger.info(`Stopping Public HTTP API`);
            await this.http.stop();
        }
        if (this.https) {
            this.logger.info(`Stopping Public HTTPS API`);
            await this.https.stop();
        }
    }
    async restart() {
        if (this.http) {
            await this.http.stop();
            await this.http.start();
        }
        if (this.https) {
            await this.https.stop();
            await this.https.start();
        }
    }
    instance(type) {
        return this[type];
    }
    async registerPlugins(name, server) {
        await server.register({ plugin: core_http_utils_1.plugins.contentType });
        await server.register({
            plugin: core_http_utils_1.plugins.corsHeaders,
        });
        await server.register({
            plugin: core_http_utils_1.plugins.whitelist,
            options: {
                whitelist: this.config.whitelist,
            },
        });
        await server.register({
            plugin: require("./plugins/set-headers"),
        });
        await server.register(core_http_utils_1.plugins.hapiAjv);
        await server.register({
            plugin: require("hapi-rate-limit"),
            options: this.config.rateLimit,
        });
        await server.register({
            plugin: require("./plugins/pagination"),
            options: {
                query: {
                    limit: {
                        default: dottie_1.get(this.config, "pagination.limit", 100),
                    },
                },
            },
        });
        await server.register({
            plugin: require("./handlers"),
            routes: { prefix: "/api" },
        });
        for (const plugin of this.config.plugins) {
            if (typeof plugin.plugin === "string") {
                plugin.plugin = require(plugin.plugin);
            }
            await server.register(plugin);
        }
        server.route({
            method: "GET",
            path: "/",
            handler() {
                return { data: "Hello World!" };
            },
        });
        // @TODO: remove this with the release of 3.0 - adds support for /api and /api/v2
        server.ext("onRequest", (request, h) => {
            if (request.url) {
                const path = request.url.pathname.replace("/v2", "");
                request.setUrl(request.url.search ? `${path}${request.url.search}` : path);
            }
            return h.continue;
        });
        await core_http_utils_1.mountServer(`Public ${name.toUpperCase()} API`, server);
    }
}
exports.Server = Server;
//# sourceMappingURL=server.js.map