import { Container, Providers } from "@arkecosystem/core-kernel";

import { EventListener } from "./event-listener";
import { NetworkMonitor } from "./network-monitor";
import { Peer } from "./peer";
import { PeerCommunicator } from "./peer-communicator";
import { PeerConnector } from "./peer-connector";
import { PeerProcessor } from "./peer-processor";
import { PeerStorage } from "./peer-storage";
import { TransactionBroadcaster } from "./transaction-broadcaster";
import { Server } from "./socket-server/server";

export class ServiceProvider extends Providers.ServiceProvider {
    private serverSymbol = Symbol.for("P2P<Server>");

    public async register(): Promise<void> {
        this.registerFactories();

        this.registerServices();

        if (process.env.DISABLE_P2P_SERVER) {
            return;
        }

        await this.buildServer(this.serverSymbol);
    }

    /**
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async boot(): Promise<void> {
        return this.app.get<Server>(this.serverSymbol).boot();
    }

    public async dispose(): Promise<void> {
        this.app.get<NetworkMonitor>(Container.Identifiers.PeerNetworkMonitor).dispose();
    }

    public async required(): Promise<boolean> {
        return true;
    }

    private registerFactories(): void {
        this.app
            .bind(Container.Identifiers.PeerFactory)
            .toFactory<Peer>(() => (ip: string) => new Peer(ip, this.config().get<number>("server.port")!));
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
        this.app
            .bind<Server>(id)
            .to(Server)
            .inSingletonScope();

        const server: Server = this.app.get<Server>(id);

        await server.initialize("P2P Server", {});
    }
}
