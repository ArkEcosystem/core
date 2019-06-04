import { Container, Logger, P2P } from "@arkecosystem/core-interfaces";
import { defaults } from "./defaults";
import { EventListener } from "./event-listener";
import { NetworkMonitor } from "./network-monitor";
import { PeerCommunicator } from "./peer-communicator";
import { PeerConnector } from "./peer-connector";
import { PeerProcessor } from "./peer-processor";
import { PeerService } from "./peer-service";
import { PeerStorage } from "./peer-storage";
import { startSocketServer } from "./socket-server";

export const makePeerService = (): PeerService => {
    const storage = new PeerStorage();
    const connector = new PeerConnector();

    const communicator = new PeerCommunicator(connector);
    const processor = new PeerProcessor({ storage, connector, communicator });
    const monitor = new NetworkMonitor({ storage, processor, communicator });

    return new PeerService({ storage, processor, connector, communicator, monitor });
};

export const plugin: Container.IPluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    required: true,
    alias: "p2p",
    async register(container: Container.IContainer, options) {
        container.resolvePlugin<Logger.ILogger>("logger").info("Starting P2P Interface");

        const service: P2P.IPeerService = makePeerService();

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

        container
            .resolvePlugin<P2P.IPeerService>("p2p")
            .getMonitor()
            .stopServer();
    },
};
