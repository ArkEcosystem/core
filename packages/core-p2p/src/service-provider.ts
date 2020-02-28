import { Container, Providers } from "@arkecosystem/core-kernel";

import { EventListener } from "./event-listener";
import { NetworkMonitor } from "./network-monitor";
import { Peer } from "./peer";
import { PeerCommunicator } from "./peer-communicator";
import { PeerConnector } from "./peer-connector";
import { PeerProcessor } from "./peer-processor";
import { PeerStorage } from "./peer-storage";
import { startSocketServer } from "./socket-server";
import { payloadProcessor } from "./socket-server/payload-processor";
import { TransactionBroadcaster } from "./transaction-broadcaster";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        this.registerFactories();

        this.registerServices();

        if (process.env.DISABLE_P2P_SERVER) {
            return;
        }

        this.app.get<NetworkMonitor>(Container.Identifiers.PeerNetworkMonitor).setServer(
            await startSocketServer(
                this.app,
                {
                    storage: this.app.get<PeerStorage>(Container.Identifiers.PeerStorage),
                    connector: this.app.get<PeerConnector>(Container.Identifiers.PeerConnector),
                    communicator: this.app.get<PeerCommunicator>(Container.Identifiers.PeerCommunicator),
                    processor: this.app.get<PeerProcessor>(Container.Identifiers.PeerProcessor),
                    networkMonitor: this.app.get<NetworkMonitor>(Container.Identifiers.PeerNetworkMonitor),
                },
                this.config().all(),
            ),
        );

        payloadProcessor.initialize();
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
        this.app
            .bind(Container.Identifiers.PeerStorage)
            .to(PeerStorage)
            .inSingletonScope();

        this.app
            .bind(Container.Identifiers.PeerConnector)
            .to(PeerConnector)
            .inSingletonScope();

        this.app
            .bind(Container.Identifiers.PeerCommunicator)
            .to(PeerCommunicator)
            .inSingletonScope();

        this.app
            .bind(Container.Identifiers.PeerProcessor)
            .to(PeerProcessor)
            .inSingletonScope();

        this.app
            .bind(Container.Identifiers.PeerNetworkMonitor)
            .to(NetworkMonitor)
            .inSingletonScope();

        this.app.get<NetworkMonitor>(Container.Identifiers.PeerNetworkMonitor).initialize();

        this.app.get<PeerCommunicator>(Container.Identifiers.PeerCommunicator).initialize();

        this.app.get<PeerProcessor>(Container.Identifiers.PeerProcessor).initialize();

        this.app
            .bind("p2p.event-listener")
            .to(EventListener)
            .inSingletonScope();

        this.app.bind(Container.Identifiers.PeerTransactionBroadcaster).to(TransactionBroadcaster);
    }
}
