import { app, Contracts } from "@arkecosystem/core-kernel";

export class EventListener {
    private readonly emitter: Contracts.Kernel.Events.EventDispatcher = app.get<
        Contracts.Kernel.Events.EventDispatcher
    >("events");

    public constructor(service: Contracts.P2P.PeerService) {
        const connector: Contracts.P2P.PeerConnector = service.getConnector();
        const storage: Contracts.P2P.PeerStorage = service.getStorage();

        this.emitter.listen("internal.p2p.disconnectPeer", (name, { peer }) => {
            connector.disconnect(peer);
            storage.forgetPeer(peer);
        });

        const exitHandler = () => service.getMonitor().stopServer();

        process.on("SIGINT", exitHandler);
        process.on("exit", exitHandler);
    }
}
