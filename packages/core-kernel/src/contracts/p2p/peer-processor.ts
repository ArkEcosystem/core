export interface AcceptNewPeerOptions {
    seed?: boolean;
    lessVerbose?: boolean;
}

export interface PeerProcessor {
    validateAndAcceptPeer(peer, options?: AcceptNewPeerOptions): Promise<void>;
    validatePeerIp(peer, options?: AcceptNewPeerOptions): boolean;
}
