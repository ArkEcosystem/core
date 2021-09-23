import { P2P } from "@arkecosystem/core-interfaces";
export declare class PeerProcessor implements P2P.IPeerProcessor {
    server: any;
    nextUpdateNetworkStatusScheduled: boolean;
    private readonly logger;
    private readonly emitter;
    private readonly communicator;
    private readonly connector;
    private readonly storage;
    constructor({ communicator, connector, storage, }: {
        communicator: P2P.IPeerCommunicator;
        connector: P2P.IPeerConnector;
        storage: P2P.IPeerStorage;
    });
    validateAndAcceptPeer(peer: P2P.IPeer, options?: P2P.IAcceptNewPeerOptions): Promise<void>;
    validatePeerIp(peer: any, options?: P2P.IAcceptNewPeerOptions): boolean;
    private updatePeersAfterMilestoneChange;
    private acceptNewPeer;
}
