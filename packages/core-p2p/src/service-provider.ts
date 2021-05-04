import { Container, Providers, Services, Types, Utils } from "@arkecosystem/core-kernel";
import Joi from "joi";

import { ValidateAndAcceptPeerAction } from "./actions";
import { ChunkCache } from "./chunk-cache";
import { EventListener } from "./event-listener";
import { NetworkMonitor } from "./network-monitor";
import { Peer } from "./peer";
import { PeerCommunicator } from "./peer-communicator";
import { PeerConnector } from "./peer-connector";
import { PeerProcessor } from "./peer-processor";
import { PeerRepository } from "./peer-repository";
import { Server } from "./socket-server/server";
import { TransactionBroadcaster } from "./transaction-broadcaster";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        this.registerFactories();

        this.registerServices();

        this.registerActions();
    }

    /**
     * @returns {Promise<boolean>}
     * @memberof ServiceProvider
     */
    public async bootWhen(): Promise<boolean> {
        return !process.env.DISABLE_P2P_SERVER;
    }

    /**
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async boot(): Promise<void> {
        this.app.get<EventListener>(Container.Identifiers.PeerEventListener).initialize();

        await this.buildServer();

        return this.app.get<Server>(Container.Identifiers.P2PServer).boot();
    }

    public async dispose(): Promise<void> {
        if (!process.env.DISABLE_P2P_SERVER) {
            this.app.get<Server>(Container.Identifiers.P2PServer).dispose();
        }
    }

    public async required(): Promise<boolean> {
        return true;
    }

    public configSchema(): object {
        return Joi.object({
            server: Joi.object({
                hostname: Joi.string()
                    .ip({ version: ["ipv4", "ipv6"] })
                    .required(),
                port: Joi.number().integer().min(1).max(65535).required(),
                logLevel: Joi.number().integer().min(0).required(), // TODO: Check
            }).required(),
            minimumVersions: Joi.array().items(Joi.string()).required(),
            minimumNetworkReach: Joi.number().integer().min(0).required(),
            verifyTimeout: Joi.number().integer().min(0).required(),
            getBlocksTimeout: Joi.number().integer().min(0).required(),
            maxPeersBroadcast: Joi.number().integer().min(0).required(),
            maxSameSubnetPeers: Joi.number().integer().min(0).required(),
            maxPeerSequentialErrors: Joi.number().integer().min(0).required(),
            whitelist: Joi.array().items(Joi.string()).required(),
            blacklist: Joi.array().items(Joi.string()).required(),
            remoteAccess: Joi.array()
                .items(Joi.string().ip({ version: ["ipv4", "ipv6"] }))
                .required(),
            dns: Joi.array()
                .items(Joi.string().ip({ version: ["ipv4", "ipv6"] }))
                .required(),
            ntp: Joi.array().items(Joi.string()).required(),
            rateLimit: Joi.number().integer().min(1).required(),
            rateLimitPostTransactions: Joi.number().integer().min(1).required(),
            networkStart: Joi.bool(),
            disableDiscovery: Joi.bool(),
            skipDiscovery: Joi.bool(),
            ignoreMinimumNetworkReach: Joi.bool(),
        }).unknown(true);
    }

    private registerFactories(): void {
        this.app
            .bind(Container.Identifiers.PeerFactory)
            .toFactory<Peer>(() => (ip: string) => new Peer(ip, Number(this.config().get<number>("server.port"))!));
    }

    private registerServices(): void {
        this.app.bind(Container.Identifiers.PeerRepository).to(PeerRepository).inSingletonScope();

        this.app.bind(Container.Identifiers.PeerConnector).to(PeerConnector).inSingletonScope();

        this.app.bind(Container.Identifiers.PeerCommunicator).to(PeerCommunicator).inSingletonScope();

        this.app.bind(Container.Identifiers.PeerProcessor).to(PeerProcessor).inSingletonScope();

        this.app.bind(Container.Identifiers.PeerChunkCache).to(ChunkCache).inSingletonScope();

        this.app.bind(Container.Identifiers.PeerNetworkMonitor).to(NetworkMonitor).inSingletonScope();

        this.app.bind(Container.Identifiers.PeerEventListener).to(EventListener).inSingletonScope();

        this.app.bind(Container.Identifiers.PeerTransactionBroadcaster).to(TransactionBroadcaster);

        this.app.bind<Server>(Container.Identifiers.P2PServer).to(Server).inSingletonScope();
    }

    private async buildServer(): Promise<void> {
        const server: Server = this.app.get<Server>(Container.Identifiers.P2PServer);
        const serverConfig = this.config().get<Types.JsonObject>("server");
        Utils.assert.defined<Types.JsonObject>(serverConfig);

        await server.initialize("P2P Server", serverConfig);
    }

    private registerActions(): void {
        this.app
            .get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService)
            .bind("validateAndAcceptPeer", new ValidateAndAcceptPeerAction(this.app));
    }
}
