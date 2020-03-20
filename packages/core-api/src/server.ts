import { Container, Contracts, Providers, Types } from "@arkecosystem/core-kernel";
import { badData } from "@hapi/boom";
import { Server as HapiServer, ServerInjectOptions, ServerInjectResponse, ServerRoute } from "@hapi/hapi";
import { readFileSync } from "fs";

import { createSchemas } from "./schemas";

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
     * @param {string} name
     * @param {Types.JsonObject} optionsServer
     * @returns {Promise<void>}
     * @memberof Server
     */
    public async initialize(name: string, optionsServer: Types.JsonObject): Promise<void> {
        this.name = name;
        this.server = new HapiServer(this.getServerOptions(optionsServer));
        this.server.app.app = this.app;
        this.server.app.schemas = createSchemas({
            pagination: {
                limit: this.configuration.getRequired<number>("plugins.pagination.limit"),
            },
        });

        this.server.ext({
            type: "onPreHandler",
            async method(request, h) {
                request.headers["content-type"] = "application/json";

                return h.continue;
            },
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

            this.app.log.info(`${this.name} Server started at ${this.server.info.uri}`);
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

            this.app.log.info(`${this.name} Server stopped at ${this.server.info.uri}`);
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

        return {
            ...{
                router: {
                    stripTrailingSlash: true,
                },
                routes: {
                    payload: {
                        async failAction(request, h, err) {
                            /* istanbul ignore next */
                            return badData(err.message);
                        },
                    },
                    validate: {
                        async failAction(request, h, err) {
                            /* istanbul ignore next */
                            return badData(err.message);
                        },
                    },
                },
            },
            ...options,
        };
    }
}
