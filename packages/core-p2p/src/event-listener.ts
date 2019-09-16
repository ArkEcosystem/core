import { Container, Contracts } from "@arkecosystem/core-kernel";

@Container.injectable()
export class EventListener {
    @Container.inject(Container.Identifiers.EventDispatcherService)
    private readonly emitter: Contracts.Kernel.Events.EventDispatcher;

    @Container.inject(Container.Identifiers.PeerConnector)
    private readonly connector: Contracts.P2P.PeerConnector;

    @Container.inject(Container.Identifiers.PeerStorage)
    private readonly storage: Contracts.P2P.PeerStorage;

    @Container.inject(Container.Identifiers.PeerNetworkMonitor)
    private readonly networkMonitor: Contracts.P2P.NetworkMonitor;

    public init() {
        this.emitter.listen("internal.p2p.disconnectPeer", ({ name, data: peer }) => {
            this.connector.disconnect(peer);

            this.storage.forgetPeer(peer);
        });

        const exitHandler = () => this.networkMonitor.stopServer();

        process.on("SIGINT", exitHandler);
        process.on("exit", exitHandler);
    }
}
