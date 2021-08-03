import { Container, Contracts, Types } from "@arkecosystem/core-kernel";
import { Server as HapiServer, ServerInjectOptions, ServerInjectResponse, ServerRoute } from "@hapi/hapi";

import { plugin as hapiNesPlugin } from "../hapi-nes";
import { AcceptPeerPlugin } from "./plugins/accept-peer";
import { AwaitBlockPlugin } from "./plugins/await-block";
import { CodecPlugin } from "./plugins/codec";
import { IsAppReadyPlugin } from "./plugins/is-app-ready";
import { RateLimitPlugin } from "./plugins/rate-limit";
import { ValidatePlugin } from "./plugins/validate";
import { WhitelistForgerPlugin } from "./plugins/whitelist-forger";
import { BlocksRoute } from "./routes/blocks";
import { InternalRoute } from "./routes/internal";
import { PeerRoute } from "./routes/peer";
import { TransactionsRoute } from "./routes/transactions";

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
    private server!: HapiServer;

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

        const address = optionsServer.hostname;
        const port = Number(optionsServer.port);

        this.server = new HapiServer({ address, port });
        this.server.app = this.app;
        await this.server.register({
            plugin: hapiNesPlugin,
            options: {
                maxPayload: 20971520, // 20 MB TODO to adjust
            },
        });

        this.app.resolve(InternalRoute).register(this.server);
        this.app.resolve(PeerRoute).register(this.server);
        this.app.resolve(BlocksRoute).register(this.server);
        this.app.resolve(TransactionsRoute).register(this.server);

        // onPreAuth
        this.app.resolve(WhitelistForgerPlugin).register(this.server);
        this.app.resolve(RateLimitPlugin).register(this.server);
        this.app.resolve(AwaitBlockPlugin).register(this.server);

        // onPostAuth
        this.app.resolve(CodecPlugin).register(this.server);
        this.app.resolve(ValidatePlugin).register(this.server);
        this.app.resolve(IsAppReadyPlugin).register(this.server);

        // onPreHandler
        this.app.resolve(AcceptPeerPlugin).register(this.server);
    }

    /**
     * @returns {Promise<void>}
     * @memberof Server
     */
    public async boot(): Promise<void> {
        try {
            await this.server.start();
            this.logger.info(`${this.name} started at ${this.server.info.uri}`);
        } catch {
            await this.app.terminate(`Failed to start ${this.name}!`);
        }
    }

    /**
     * @returns {Promise<void>}
     * @memberof Server
     */
    public async dispose(): Promise<void> {
        try {
            await this.server.stop();
            this.logger.info(`${this.name} stopped at ${this.server.info.uri}`);
        } catch {
            await this.app.terminate(`Failed to stop ${this.name}!`);
        }
    }

    /**
     * @param {(any|any[])} plugins
     * @returns {Promise<void>}
     * @memberof Server
     */
    // @todo: add proper types
    public async register(plugins: any | any[]): Promise<void> {
        await this.server.register(plugins);
    }

    /**
     * @param {(ServerRoute | ServerRoute[])} routes
     * @returns {Promise<void>}
     * @memberof Server
     */
    public async route(routes: ServerRoute | ServerRoute[]): Promise<void> {
        await this.server.route(routes);
    }

    /**
     * @param {(string | ServerInjectOptions)} options
     * @returns {Promise<void>}
     * @memberof Server
     */
    public async inject(options: string | ServerInjectOptions): Promise<ServerInjectResponse> {
        await this.server.inject(options);
    }
}
