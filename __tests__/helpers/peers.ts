import { P2P } from "@arkecosystem/core-interfaces";
import { Peer } from "../../packages/core-p2p/src/peer";
import { makePeerService } from "../../packages/core-p2p/src/plugin";

export const stubPeer: P2P.IPeer = createStubPeer({ ip: "1.2.3.4", port: 4000 });

export function createStubPeer(stub): P2P.IPeer {
    return Object.assign(new Peer(stub.ip, stub.port), stub);
}

export function createPeerService() {
    const service = makePeerService();

    return {
        service,
        storage: service.getStorage(),
        processor: service.getProcessor(),
        connector: service.getConnector(),
        communicator: service.getCommunicator(),
        monitor: service.getMonitor(),
        guard: service.getGuard(),
    };
}
