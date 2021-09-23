export interface IAcceptNewPeerOptions {
    seed?: boolean;
    lessVerbose?: boolean;
}
export interface IPeerProcessor {
    validateAndAcceptPeer(peer: any, options?: IAcceptNewPeerOptions): Promise<void>;
    validatePeerIp(peer: any, options?: IAcceptNewPeerOptions): boolean;
}
