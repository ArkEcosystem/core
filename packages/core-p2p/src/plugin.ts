import { Container, Logger, P2P } from "@arkecosystem/core-interfaces";
import { defaults } from "./defaults";
import { EventListener } from "./event-listener";
import { NetworkMonitor } from "./network-monitor";
import { PeerCommunicator } from "./peer-communicator";
import { PeerConnector } from "./peer-connector";
import { PeerGuard } from "./peer-guard";
import { PeerProcessor } from "./peer-processors";
import { PeerService } from "./peer-service";
import { PeerStorage } from "./peer-storage";
import { startSocketServer } from "./socket-server";

export const makePeerService = (): PeerService => {
    const storage = new PeerStorage();
    const connector = new PeerConnector();

    const guard = new PeerGuard(connector);
    const communicator = new PeerCommunicator(connector);
    const processor = new PeerProcessor({ storage, guard, connector, communicator });
    const monitor = new NetworkMonitor({ storage, processor, communicator });

    return new PeerService({ storage, processor, connector, communicator, monitor, guard });
};

export const plugin: Container.IPluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "p2p",
    async register(container: Container.IContainer, options) {
        container.resolvePlugin<Logger.ILogger>("logger").info("Starting P2P Interface");

        const service = makePeerService();

        // tslint:disable-next-line: no-unused-expression
        new EventListener(service);

        if (!process.env.DISABLE_P2P_SERVER) {
            service.getMonitor().setServer(await startSocketServer(service, options));
        }

        await service.getMonitor().start(options);

        return service;
    },
    async deregister(container: Container.IContainer, options) {
        container.resolvePlugin<Logger.ILogger>("logger").info("Stopping P2P Interface");

        const service = container.resolvePlugin<P2P.IPeerService>("p2p");
        service.getStorage().savePeers();
    },
};
