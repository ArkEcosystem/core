import { Contracts } from "@arkecosystem/core-kernel";

import { Peer } from "../../../core-p2p/src/peer";

export const createStubPeer = (stub): Contracts.P2P.Peer => {
    const peer: Contracts.P2P.Peer = new Peer(stub.ip);
    (peer as any).port = stub.port;

    delete stub.port;

    return Object.assign(peer, stub);
};

export const stubPeer: Contracts.P2P.Peer = createStubPeer({ ip: "1.2.3.4", port: 4000 });
