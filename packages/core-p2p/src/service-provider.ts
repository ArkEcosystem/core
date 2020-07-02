import { Container, Providers, Services, Types, Utils } from "@arkecosystem/core-kernel";

import { ValidateAndAcceptPeerAction } from "./actions";
import { EventListener } from "./event-listener";
import { NetworkMonitor } from "./network-monitor";
import { Peer } from "./peer";
import { PeerCommunicator } from "./peer-communicator";
import { PeerConnector } from "./peer-connector";
import { PeerProcessor } from "./peer-processor";
import { PeerStorage } from "./peer-storage";
import { Server } from "./socket-server/server";
import { TransactionBroadcaster } from "./transaction-broadcaster";

export class ServiceProvider extends Providers.ServiceProvider {
    private serverSymbol = Symbol.for("P2P<Server>");

    public async register(): Promise<void> {
        this.registerFactories();

        this.registerServices();

        this.registerActions();

        if (process.env.DISABLE_P2P_SERVER) {
            return;
        }

        await this.buildServer(this.serverSymbol);
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
        return this.app.get<Server>(this.serverSymbol).boot();
    }

    public async dispose(): Promise<void> {
        if (process.env.DISABLE_P2P_SERVER) {
            return;
        }

        this.app.get<Server>(this.serverSymbol).dispose();
    }

    public async required(): Promise<boolean> {
        return true;
    }

    private registerFactories(): void {
        this.app
            .bind(Container.Identifiers.PeerFactory)
            .toFactory<Peer>(() => (ip: string) => new Peer(ip, Number(this.config().get<number>("server.port"))!));
    }

    private registerServices(): void {
        this.app.bind(Container.Identifiers.PeerStorage).to(PeerStorage).inSingletonScope();

        this.app.bind(Container.Identifiers.PeerConnector).to(PeerConnector).inSingletonScope();

        this.app.bind(Container.Identifiers.PeerCommunicator).to(PeerCommunicator).inSingletonScope();

        this.app.bind(Container.Identifiers.PeerProcessor).to(PeerProcessor).inSingletonScope();

        this.app.bind(Container.Identifiers.PeerNetworkMonitor).to(NetworkMonitor).inSingletonScope();

        this.app.get<NetworkMonitor>(Container.Identifiers.PeerNetworkMonitor).initialize();

        this.app.get<PeerCommunicator>(Container.Identifiers.PeerCommunicator).initialize();

        this.app.get<PeerProcessor>(Container.Identifiers.PeerProcessor).initialize();

        this.app.bind("p2p.event-listener").to(EventListener).inSingletonScope();

        this.app.bind(Container.Identifiers.PeerTransactionBroadcaster).to(TransactionBroadcaster);
    }

    private async buildServer(id: symbol): Promise<void> {
        this.app.bind<Server>(id).to(Server).inSingletonScope();

        const server: Server = this.app.get<Server>(id);
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
