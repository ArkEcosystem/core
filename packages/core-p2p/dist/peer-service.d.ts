import { P2P } from "@arkecosystem/core-interfaces";
export declare class PeerService implements P2P.IPeerService {
    private readonly communicator;
    private readonly connector;
    private readonly monitor;
    private readonly processor;
    private readonly storage;
    constructor({ communicator, connector, monitor, processor, storage, }: {
        communicator: P2P.IPeerCommunicator;
        connector: P2P.IPeerConnector;
        monitor: P2P.INetworkMonitor;
        processor: P2P.IPeerProcessor;
        storage: P2P.IPeerStorage;
    });
    getStorage(): P2P.IPeerStorage;
    getProcessor(): P2P.IPeerProcessor;
    getConnector(): P2P.IPeerConnector;
    getCommunicator(): P2P.IPeerCommunicator;
    getMonitor(): P2P.INetworkMonitor;
}
