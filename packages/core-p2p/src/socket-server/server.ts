import { Container, Contracts, Types } from "@arkecosystem/core-kernel";
import { Server as HapiServer, ServerInjectOptions, ServerInjectResponse, ServerRoute } from "@hapi/hapi";

import { plugin } from "../hapi-nes";
import { AcceptPeerPlugin } from "./plugins/accept-peer";
import { ValidatePlugin } from "./plugins/validate";
import { WhitelistForgerPlugin } from "./plugins/whitelist-forger";
import { InternalRoute } from "./routes/internal";
import { PeerRoute } from "./routes/peer";
import { PortsOffset } from "../enums";
import { BlocksRoute } from "./routes/blocks";
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
    private peerServer!: HapiServer;

    /**
     * @private
     * @type {HapiServer}
     * @memberof Server
     */
    private blocksServer!: HapiServer;

    /**
     * @private
     * @type {HapiServer}
     * @memberof Server
     */
    private transactionsServer!: HapiServer;

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
        const basePort = Number(optionsServer.port);

        this.peerServer = new HapiServer({ address, port: basePort + PortsOffset.Peer });
        this.blocksServer = new HapiServer({ address, port: basePort + PortsOffset.Blocks });
        this.transactionsServer = new HapiServer({ address, port: basePort + PortsOffset.Transactions });
        
        for (const server of [this.peerServer, this.blocksServer, this.transactionsServer]) {
            (server.app as any).app = this.app;
            await server.register({ plugin });

            this.app.resolve(ValidatePlugin).register(server);
        };

        this.app.resolve(InternalRoute).register(this.peerServer);
        this.app.resolve(PeerRoute).register(this.peerServer);
        this.app.resolve(WhitelistForgerPlugin).register(this.peerServer);
        this.app.resolve(AcceptPeerPlugin).register(this.peerServer);

        this.app.resolve(BlocksRoute).register(this.blocksServer);

        this.app.resolve(TransactionsRoute).register(this.transactionsServer);
    }

    /**
     * @returns {Promise<void>}
     * @memberof Server
     */
    public async boot(): Promise<void> {
        try {
            await this.peerServer.start();
            this.logger.info(`${this.name} P2P peer server started at ${this.peerServer.info.uri}`);

            await this.blocksServer.start();
            this.logger.info(`${this.name} P2P blocks server started at ${this.blocksServer.info.uri}`);

            await this.transactionsServer.start();
            this.logger.info(`${this.name} P2P transactions server started at ${this.transactionsServer.info.uri}`);
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
            await this.peerServer.stop();
            this.logger.info(`${this.name} P2P peer server stopped at ${this.peerServer.info.uri}`);

            await this.blocksServer.stop();
            this.logger.info(`${this.name} P2P blocks server stopped at ${this.blocksServer.info.uri}`);

            await this.transactionsServer.stop();
            this.logger.info(`${this.name} P2P transactions server stopped at ${this.transactionsServer.info.uri}`);
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
        for (const server of [this.peerServer, this.blocksServer, this.transactionsServer]) {
            await server.register(plugins);
        }
    }

    /**
     * @param {(ServerRoute | ServerRoute[])} routes
     * @returns {Promise<void>}
     * @memberof Server
     */
    public async route(routes: ServerRoute | ServerRoute[]): Promise<void> {
        for (const server of [this.peerServer, this.blocksServer, this.transactionsServer]) {
            await server.route(routes);
        }
    }

    /**
     * @param {(string | ServerInjectOptions)} options
     * @returns {Promise<void>}
     * @memberof Server
     */
    public async inject(options: string | ServerInjectOptions): Promise<ServerInjectResponse> {
        for (const server of [this.peerServer, this.blocksServer, this.transactionsServer]) {
            await server.inject(options);
        }
    }
}
