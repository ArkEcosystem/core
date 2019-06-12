export interface IAcceptNewPeerOptions {
    seed?: boolean;
    lessVerbose?: boolean;
}

export interface IPeerProcessor {
    validateAndAcceptPeer(peer, options?: IAcceptNewPeerOptions): Promise<void>;
    validatePeerIp(peer, options?: IAcceptNewPeerOptions): boolean;
}
