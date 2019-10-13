import { Container, Contracts } from "@arkecosystem/core-kernel";

// todo: review the implementation
@Container.injectable()
export class EventListener {
    @Container.inject(Container.Identifiers.EventDispatcherService)
    private readonly emitter: Contracts.Kernel.Events.EventDispatcher;

    @Container.inject(Container.Identifiers.PeerConnector)
    private readonly connector: Contracts.P2P.PeerConnector;

    @Container.inject(Container.Identifiers.PeerStorage)
    private readonly storage: Contracts.P2P.PeerStorage;

    @Container.inject(Container.Identifiers.PeerNetworkMonitor)
    private readonly networkMonitor: Contracts.P2P.INetworkMonitor;

    public init() {
        this.emitter.listen("internal.p2p.disconnectPeer", ({ data }) => {
            this.connector.disconnect(data);

            this.storage.forgetPeer(data);
        });

        const exitHandler = () => this.networkMonitor.stopServer();

        process.on("SIGINT", exitHandler);
        process.on("exit", exitHandler);
    }
}
