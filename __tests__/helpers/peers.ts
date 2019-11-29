import { P2P } from "@arkecosystem/core-interfaces";
import { EventListener } from "../../packages/core-p2p/src/event-listener";
import { Peer } from "../../packages/core-p2p/src/peer";
import { makePeerService } from "../../packages/core-p2p/src/plugin";

export const createStubPeer = (stub): P2P.IPeer => {
    const peer: P2P.IPeer = new Peer(stub.ip);
    (peer as any).port = stub.port;

    delete stub.port;

    return Object.assign(peer, stub);
};

export const createPeerService = () => {
    const service = makePeerService({});

    // tslint:disable-next-line: no-unused-expression
    new EventListener(service);

    return {
        service,
        storage: service.getStorage(),
        processor: service.getProcessor(),
        connector: service.getConnector(),
        communicator: service.getCommunicator(),
        monitor: service.getMonitor(),
    };
};

export const stubPeer: P2P.IPeer = createStubPeer({ ip: "1.2.3.4", port: 4000 });
