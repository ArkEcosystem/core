import { Container, Contracts, Types } from "@arkecosystem/core-kernel";
import { badData } from "@hapi/boom";
import { Server, ServerInjectOptions, ServerInjectResponse, ServerRoute } from "@hapi/hapi";
import deepmerge from "deepmerge";
import expandHomeDir from "expand-home-dir";
import { readFileSync } from "fs";
import TrailingSlash from "hapi-trailing-slash";

@Container.injectable()
export class HttpServer {
    /**
     * @private
     * @type {Contracts.Kernel.Application}
     * @memberof Server
     */
    @Container.inject(Container.Identifiers.Application)
    private readonly app: Contracts.Kernel.Application;

    /**
     * @private
     * @type {Server}
     * @memberof Server
     */
    private server: Server;

    /**
     * @private
     * @type {string}
     * @memberof Server
     */
    private name: string;

    /**
     * @param {string} name
     * @param {Types.JsonObject} optionsServer
     * @returns {Promise<void>}
     * @memberof HttpServer
     */
    public async init(name: string, optionsServer: Types.JsonObject): Promise<void> {
        this.name = name;
        this.server = new Server(this.getServerOptions(optionsServer));

        this.server.route({
            method: "GET",
            path: "/",
            handler() {
                return { data: "Hello World!" };
            },
        });

        await this.server.register({
            plugin: TrailingSlash,
            options: { method: "remove" },
        });
    }

    /**
     * @returns {Promise<void>}
     * @memberof Server
     */
    public async start(): Promise<void> {
        try {
            await this.server.start();

            this.app.log.info(`${this.name} Server started at ${this.server.info.uri}`);
        } catch (error) {
            await this.app.terminate(`Failed to start ${this.name} Server!`, error);
        }
    }

    /**
     * @returns {Promise<void>}
     * @memberof Server
     */
    public async stop(): Promise<void> {
        try {
            await this.server.stop();

            this.app.log.info(`${this.name} Server stopped at ${this.server.info.uri}`);
        } catch (error) {
            await this.app.terminate(`Failed to stop ${this.name} Server!`, error);
        }
    }

    /**
     * @param {(any|any[])} plugins
     * @returns {Promise<void>}
     * @memberof HttpServer
     */
    // @todo: add proper types
    public async register(plugins: any | any[]): Promise<void> {
        return this.server.register(plugins);
    }

    /**
     * @param {(ServerRoute | ServerRoute[])} routes
     * @returns {Promise<void>}
     * @memberof HttpServer
     */
    public async route(routes: ServerRoute | ServerRoute[]): Promise<void> {
        return this.server.route(routes);
    }

    /**
     * @param {(string | ServerInjectOptions)} options
     * @returns {Promise<void>}
     * @memberof HttpServer
     */
    public async inject(options: string | ServerInjectOptions): Promise<ServerInjectResponse> {
        return this.server.inject(options);
    }

    /**
     * @param {(string | ServerInjectOptions)} options
     * @returns {void}
     * @memberof HttpServer
     */
    public views(options: any): void {
        // @ts-ignore
        this.server.views(options);
    }

    /**
     * @private
     * @param {Record<string, any>} options
     * @returns {object}
     * @memberof HttpServer
     */
    private getServerOptions(options: Record<string, any>): object {
        options = { ...options };

        delete options.enabled;

        if (options.tls && Object.keys(options.tls).length) {
            options.tls.key = readFileSync(expandHomeDir(options.tls.key)).toString();
            options.tls.cert = readFileSync(expandHomeDir(options.tls.cert)).toString();
        }

        return deepmerge(
            {
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
            options,
        );
    }
}
