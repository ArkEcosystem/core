import { Container, Contracts, Providers, Types, Utils } from "@arkecosystem/core-kernel";
import { badData } from "@hapi/boom";
import { Server as HapiServer, ServerInjectOptions, ServerInjectResponse, ServerRoute } from "@hapi/hapi";
import { readFileSync } from "fs";

import * as Schemas from "./schemas";

// todo: review the implementation
@Container.injectable()
export class Server {
    /**
     * @private
     * @type {Contracts.Kernel.Application}
     * @memberof Server
     */
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Contracts.Kernel.Application;

    /**
     * @private
     * @type {Providers.PluginConfiguration}
     * @memberof Server
     */
    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-api")
    private readonly configuration!: Providers.PluginConfiguration;

    /**
     * @private
     * @type {Contracts.Kernel.Logger}
     * @memberof Server
     */
    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    /**
     * @private
     * @type {HapiServer}
     * @memberof Server
     */
    private server: HapiServer;

    /**
     * @private
     * @type {string}
     * @memberof Server
     */
    private name!: string;

    /**
     * @type {string}
     * @memberof Server
     */
    public get uri(): string {
        return this.server.info.uri;
    }

    /**
     * @param {string} name
     * @param {Types.JsonObject} optionsServer
     * @returns {Promise<void>}
     * @memberof Server
     */
    public async initialize(name: string, optionsServer: Types.JsonObject): Promise<void> {
        this.name = name;
        this.server = new HapiServer(this.getServerOptions(optionsServer));

        const timeout: number = this.configuration.getRequired<number>("plugins.socketTimeout");
        this.server.listener.timeout = timeout;
        this.server.listener.keepAliveTimeout = timeout;
        this.server.listener.headersTimeout = timeout;

        this.server.app.app = this.app;
        this.server.app.schemas = Schemas;

        this.server.ext("onPreHandler", (request, h) => {
            request.headers["content-type"] = "application/json";
            return h.continue;
        });

        this.server.ext("onPreResponse", (request, h) => {
            if (request.response.isBoom && request.response.isServer) {
                this.logger.error(request.response.stack);
            }
            return h.continue;
        });

        this.server.route({
            method: "GET",
            path: "/",
            handler() {
                return { data: "Hello World!" };
            },
        });
    }

    /**
     * @returns {Promise<void>}
     * @memberof Server
     */
    public async boot(): Promise<void> {
        try {
            await this.server.start();

            this.logger.info(`${this.name} Server started at ${this.server.info.uri}`);
        } catch {
            await this.app.terminate(`Failed to start ${this.name} Server!`);
        }
    }

    /**
     * @returns {Promise<void>}
     * @memberof Server
     */
    public async dispose(): Promise<void> {
        try {
            await this.server.stop();

            this.logger.info(`${this.name} Server stopped at ${this.server.info.uri}`);
        } catch {
            await this.app.terminate(`Failed to stop ${this.name} Server!`);
        }
    }

    /**
     * @param {(any|any[])} plugins
     * @returns {Promise<void>}
     * @memberof Server
     */
    // @todo: add proper types
    public async register(plugins: any | any[]): Promise<void> {
        return this.server.register(plugins);
    }

    /**
     * @param {(ServerRoute | ServerRoute[])} routes
     * @returns {Promise<void>}
     * @memberof Server
     */
    public async route(routes: ServerRoute | ServerRoute[]): Promise<void> {
        return this.server.route(routes);
    }

    public getRoute(method: string, path: string): ServerRoute | undefined {
        return this.server.table().find((route) => route.method === method.toLowerCase() && route.path === path);
    }

    /**
     * @param {(string | ServerInjectOptions)} options
     * @returns {Promise<void>}
     * @memberof Server
     */
    public async inject(options: string | ServerInjectOptions): Promise<ServerInjectResponse> {
        return this.server.inject(options);
    }

    /**
     * @private
     * @param {Record<string, any>} options
     * @returns {object}
     * @memberof Server
     */
    private getServerOptions(options: Record<string, any>): object {
        options = { ...options };

        delete options.enabled;

        if (options.tls) {
            options.tls.key = readFileSync(options.tls.key).toString();
            options.tls.cert = readFileSync(options.tls.cert).toString();
        }

        const validateContext = {
            configuration: {
                plugins: {
                    pagination: {
                        limit: this.configuration.getRequired<number>("plugins.pagination.limit"),
                    },
                },
            },
        };

        const defaultOptions = {
            router: {
                stripTrailingSlash: true,
            },
            routes: {
                payload: {
                    /* istanbul ignore next */
                    async failAction(request, h, err) {
                        return badData(err.message);
                    },
                },
                validate: {
                    options: {
                        context: validateContext,
                    },

                    /* istanbul ignore next */
                    async failAction(request, h, err) {
                        return badData(err.message);
                    },
                },
            },
        };

        return Utils.merge(defaultOptions, options);
    }
}
