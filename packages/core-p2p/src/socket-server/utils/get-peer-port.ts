import { Contracts } from "@arkecosystem/core-kernel";
import { PortsOffset } from "../../enums";

const mapEventPrefixToPortOffset = {
    "p2p.peer": PortsOffset.Peer,
    "p2p.internal": PortsOffset.Peer,
    "p2p.blocks": PortsOffset.Blocks,
    "p2p.transactions": PortsOffset.Transactions,
};

export const getPeerPortForEvent = (peer: Contracts.P2P.Peer, event: string) => {
    const eventPrefix = event.split(".").slice(0, 2).join(".");
    return Number(peer.port) + mapEventPrefixToPortOffset[eventPrefix];
};

export const getAllPeerPorts = (peer: Contracts.P2P.Peer) => {
    return [
        PortsOffset.Peer,
        PortsOffset.Blocks,
        PortsOffset.Transactions
    ].map((portOffset) => Number(peer.port) + portOffset);
};
