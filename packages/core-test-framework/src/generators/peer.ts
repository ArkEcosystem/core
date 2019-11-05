import { Contracts } from "@arkecosystem/core-kernel";
import { Peer } from "@arkecosystem/core-p2p/src/peer";
import Chance from "chance";

interface PeerOptions {
    count: number;
}

export const generatePeer = (data, opts: PeerOptions = { count: 1 }): Contracts.P2P.Peer[] => {
    const chance: Chance = new Chance();

    const peers: Peer[] = [];
    for (let i = 0; i < opts.count; i++) {
        // todo: we need to inject the app instance as the first argument
        // @ts-ignore
        const peer = new Peer(chance.ip());
        peer.port = data.port;
        peer.version = data.version;
        peer.latency = data.latency;

        peers.push(peer);
    }

    return [data];
};

// export const stubPeer: Contracts.P2P.Peer = generatePeer({ ip: "1.2.3.4", port: 4000 })[0];
