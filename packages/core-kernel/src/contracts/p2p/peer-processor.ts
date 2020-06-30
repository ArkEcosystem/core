import { Peer } from "./peer";

export interface AcceptNewPeerOptions {
    seed?: boolean;
    lessVerbose?: boolean;
}

export interface PeerProcessor {
    initialize();

    validateAndAcceptPeer(peer: Peer, options?: AcceptNewPeerOptions): Promise<void>;

    validatePeerIp(peer, options?: AcceptNewPeerOptions): boolean;

    isWhitelisted(peer): boolean;
}
