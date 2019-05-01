import { app } from "@arkecosystem/core-container";
import { createSecureServer, createServer, mountServer, plugins } from "@arkecosystem/core-http-utils";
import { Logger } from "@arkecosystem/core-interfaces";
import Hapi from "@hapi/hapi";
import { registerFormats } from "./formats";

export class Server {
    private logger = app.resolvePlugin<Logger.ILogger>("logger");

    private http: any;
    private https: any;

    public constructor(private config: any) {}

    public async start(): Promise<void> {
        const options = {
            host: this.config.host,
            port: this.config.port,
            routes: {
                cors: {
                    additionalHeaders: ["api-version"],
                },
                validate: {
                    async failAction(request, h, err) {
                        throw err;
                    },
                },
            },
        };

        if (this.config.enabled) {
            this.http = await createServer(options);
            this.http.app.config = this.config;

            this.registerPlugins("HTTP", this.http);
        }

        if (this.config.ssl.enabled) {
            this.https = await createSecureServer(options, undefined, this.config.ssl);
            this.https.app.config = this.config;

            this.registerPlugins("HTTPS", this.https);
        }
    }

    public async stop(): Promise<void> {
        if (this.http) {
            this.logger.info(`Stopping Public HTTP API`);
            await this.http.stop();
        }

        if (this.https) {
            this.logger.info(`Stopping Public HTTPS API`);
            await this.https.stop();
        }
    }

    public async restart(): Promise<void> {
        if (this.http) {
            await this.http.stop();
            await this.http.start();
        }

        if (this.https) {
            await this.https.stop();
            await this.https.start();
        }
    }

    public instance(type: string): Hapi.Server {
        return this[type];
    }

    private async registerPlugins(name: string, server: Hapi.Server): Promise<void> {
        // TODO: enable after mainnet migration
        // await server.register({ plugin: plugins.contentType })

        await server.register({
            plugin: plugins.corsHeaders,
        });

        await server.register({
            plugin: plugins.whitelist,
            options: {
                whitelist: this.config.whitelist,
                name: "Public API",
            },
        });

        await server.register({
            plugin: require("./plugins/set-headers"),
        });

        await server.register({
            plugin: require("@faustbrian/hapi-version"),
            options: this.config.versions,
        });

        await server.register({
            plugin: require("./plugins/endpoint-version"),
            options: { versions: this.config.versions.versions.allowed },
        });

        await server.register({
            plugin: require("./plugins/caster"),
        });

        await server.register({
            plugin: plugins.hapiAjv,
            options: {
                registerFormats,
            },
        });

        await server.register({
            plugin: require("hapi-rate-limit"),
            options: this.config.rateLimit,
        });

        await server.register({
            plugin: require("hapi-pagination"),
            options: {
                meta: {
                    baseUri: "",
                },
                query: {
                    limit: {
                        default: this.config.pagination.limit,
                    },
                },
                results: {
                    name: "data",
                },
                routes: {
                    include: this.config.pagination.include,
                    exclude: ["*"],
                },
            },
        });

        for (const plugin of this.config.plugins) {
            if (typeof plugin.plugin === "string") {
                plugin.plugin = require(plugin.plugin);
            }

            await server.register(plugin);
        }

        await mountServer(`Public ${name.toUpperCase()} API`, server);
    }
}
