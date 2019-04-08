import { IPeer } from "./peer";
import { IPunishment } from "./peer-guard";

export interface IAcceptNewPeerOptions {
    seed?: boolean;
    lessVerbose?: boolean;
}

export interface IPeerProcessor {
    validateAndAcceptPeer(peer, options?: IAcceptNewPeerOptions): Promise<void>;
    validatePeer(peer, options?: IAcceptNewPeerOptions): boolean;
    acceptNewPeer(peer, options?: IAcceptNewPeerOptions): Promise<void>;

    suspend(peer: IPeer, punishment?: IPunishment): void;
    unsuspend(peer: IPeer): Promise<void>;
}
