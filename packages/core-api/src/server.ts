import { Container, Contracts, Types } from "@arkecosystem/core-kernel";
import { Server as HapiServer } from "@hapi/hapi";

import Handlers from "./handlers";
import { preparePlugins } from "./plugins";

@Container.injectable()
export class Server {
    /**
     * @private
     * @type {Contracts.Kernel.Application}
     * @memberof Server
     */
    @Container.inject(Container.Identifiers.Application)
    private readonly app: Contracts.Kernel.Application;

    /**
     * @private
     * @type {HapiServer}
     * @memberof Server
     */
    private server: HapiServer;

    /**
     * @param {Options} options
     * @returns {Promise<void>}
     * @memberof Server
     */
    public async init(optionsServer: Types.JsonObject, optionsPlugins: Types.JsonObject): Promise<void> {
        this.server = new HapiServer(optionsServer);

        await this.server.register(preparePlugins(optionsPlugins));

        this.server.route({
            method: "GET",
            path: "/",
            handler() {
                return { data: "Hello World!" };
            },
        });

        await this.server.register({
            plugin: Handlers,
            routes: { prefix: "/api" },
        });
    }

    /**
     * @returns {Promise<void>}
     * @memberof Server
     */
    public async start(): Promise<void> {
        await this.server.start();

        this.app.log.info(`Server started at ${this.server.info.uri}`);
    }

    /**
     * @returns {Promise<void>}
     * @memberof Server
     */
    public async stop(): Promise<void> {
        console.log(this.server);

        await this.server.stop();

        this.app.log.info(`Server stopped at ${this.server.info.uri}`);
    }
}
