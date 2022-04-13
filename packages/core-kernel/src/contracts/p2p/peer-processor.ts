import { Peer } from "./peer";

export interface Headers {
    version?: string;
}

export interface AcceptNewPeerOptions {
    seed?: boolean;
    lessVerbose?: boolean;
}

export interface PeerProcessor {
    initialize();

    validateAndAcceptPeer(peer: Peer, headers: Headers, options?: AcceptNewPeerOptions): Promise<void>;

    validatePeerIp(peer, options?: AcceptNewPeerOptions): boolean;

    isWhitelisted(peer): boolean;
}
