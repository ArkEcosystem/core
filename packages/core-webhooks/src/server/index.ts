import { Container, Contracts, Types, Utils } from "@arkecosystem/core-kernel";
import { badData } from "@hapi/boom";
import Boom from "@hapi/boom";
import { Server as HapiServer, ServerInjectOptions, ServerInjectResponse } from "@hapi/hapi";
import { randomBytes } from "crypto";

import { Database } from "../database";
import { Identifiers } from "../identifiers";
import { Webhook } from "../interfaces";
import { whitelist } from "./plugins/whitelist";
import * as schema from "./schema";
import * as utils from "./utils";

/**
 * @export
 * @class Server
 */
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
     * @type {Contracts.Kernel.Application}
     * @memberof Server
     */
    @Container.inject(Identifiers.Database)
    private readonly database!: Database;

    /**
     * @private
     * @type {Contracts.Kernel.Application}
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
     * @param {string} name
     * @param {Types.JsonObject} optionsServer
     * @returns {Promise<void>}
     * @memberof Server
     */
    public async register(optionsServer: Types.JsonObject): Promise<void> {
        this.server = new HapiServer(this.getServerOptions(optionsServer));
        this.server.app.database = this.database;

        this.server.ext({
            type: "onPreHandler",
            async method(request, h) {
                request.headers["content-type"] = "application/json";

                return h.continue;
            },
        });

        await this.registerPlugins(optionsServer);

        await this.registerRoutes();
    }

    /**
     * @returns {Promise<void>}
     * @memberof Server
     */
    public async boot(): Promise<void> {
        try {
            await this.server.start();

            this.logger.info(`Webhook Server started at ${this.server.info.uri}`);
        } catch (error) {
            await this.app.terminate(`Failed to start Webhook Server!`, error);
        }
    }

    /**
     * @returns {Promise<void>}
     * @memberof Server
     */
    public async dispose(): Promise<void> {
        try {
            await this.server.stop();

            this.logger.info(`Webhook Server stopped at ${this.server.info.uri}`);
        } catch (error) {
            await this.app.terminate(`Failed to stop Webhook Server!`, error);
        }
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
        options = {
            ...options.http,
            whitelist: options.whitelist,
        };

        delete options.http;
        delete options.enabled;
        delete options.whitelist;

        return {
            ...{
                router: {
                    stripTrailingSlash: true,
                },
                routes: {
                    payload: {
                        async failAction(request, h, err) {
                            return badData(err.message);
                        },
                    },
                    validate: {
                        async failAction(request, h, err) {
                            return badData(err.message);
                        },
                    },
                },
            },
            ...options,
        };
    }

    /**
     * @private
     * @param {Types.JsonObject} config
     * @returns {Promise<void>}
     * @memberof Server
     */
    private async registerPlugins(config: Types.JsonObject): Promise<void> {
        await this.server.register({
            plugin: whitelist,
            options: {
                whitelist: config.whitelist,
            },
        });
    }

    /**
     * @private
     * @returns {void}
     * @memberof Server
     */
    private registerRoutes(): void {
        this.server.route({
            method: "GET",
            path: "/",
            handler() {
                return { data: "Hello World!" };
            },
        });

        this.server.route({
            method: "GET",
            path: "/api/webhooks",
            handler: (request) => {
                return {
                    data: request.server.app.database.all().map((webhook) => {
                        webhook = { ...webhook };
                        delete webhook.token;
                        return webhook;
                    }),
                };
            },
        });

        this.server.route({
            method: "POST",
            path: "/api/webhooks",
            handler(request: any, h) {
                const token: string = randomBytes(32).toString("hex");

                return h
                    .response(
                        utils.respondWithResource({
                            ...request.server.app.database.create({
                                ...request.payload,
                                ...{ token: token.substring(0, 32) },
                            }),
                            ...{ token },
                        }),
                    )
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

        this.server.route({
            method: "GET",
            path: "/api/webhooks/{id}",
            async handler(request) {
                if (!request.server.app.database.hasById(request.params.id)) {
                    return Boom.notFound();
                }

                const webhook: Webhook | undefined = Utils.cloneDeep(
                    request.server.app.database.findById(request.params.id),
                );

                if (!webhook) {
                    return Boom.badImplementation();
                }

                delete webhook.token;

                return utils.respondWithResource(webhook);
            },
            options: {
                validate: schema.show,
            },
        });

        this.server.route({
            method: "PUT",
            path: "/api/webhooks/{id}",
            handler: (request, h) => {
                if (!request.server.app.database.hasById(request.params.id)) {
                    return Boom.notFound();
                }

                request.server.app.database.update(request.params.id, request.payload as Webhook);

                return h.response(undefined).code(204);
            },
            options: {
                validate: schema.update,
            },
        });

        this.server.route({
            method: "DELETE",
            path: "/api/webhooks/{id}",
            handler: (request, h) => {
                if (!request.server.app.database.hasById(request.params.id)) {
                    return Boom.notFound();
                }

                request.server.app.database.destroy(request.params.id);

                return h.response(undefined).code(204);
            },
            options: {
                validate: schema.destroy,
            },
        });
    }
}
