import { Container, Contracts, Enums } from "@arkecosystem/core-kernel";

import { DisconnectPeer } from "./listeners";

// todo: review the implementation
@Container.injectable()
export class EventListener {
    @Container.inject(Container.Identifiers.Application)
    protected readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.EventDispatcherService)
    private readonly emitter!: Contracts.Kernel.EventDispatcher;

    @Container.inject(Container.Identifiers.PeerNetworkMonitor)
    private readonly networkMonitor!: Contracts.P2P.INetworkMonitor;

    public init() {
        this.emitter.listen(Enums.PeerEvent.Disconnect, this.app.resolve(DisconnectPeer));

        const exitHandler = () => this.networkMonitor.stopServer();

        process.on("SIGINT", exitHandler);
        process.on("exit", exitHandler);
    }
}
