import { Contracts } from "@arkecosystem/core-kernel";

export class PeerService implements Contracts.P2P.PeerService {
    private readonly communicator: Contracts.P2P.PeerCommunicator;
    private readonly connector: Contracts.P2P.PeerConnector;
    private readonly monitor: Contracts.P2P.NetworkMonitor;
    private readonly processor: Contracts.P2P.PeerProcessor;
    private readonly storage: Contracts.P2P.PeerStorage;

    public constructor({
        communicator,
        connector,
        monitor,
        processor,
        storage,
    }: {
        communicator: Contracts.P2P.PeerCommunicator;
        connector: Contracts.P2P.PeerConnector;
        monitor: Contracts.P2P.NetworkMonitor;
        processor: Contracts.P2P.PeerProcessor;
        storage: Contracts.P2P.PeerStorage;
    }) {
        this.communicator = communicator;
        this.connector = connector;
        this.monitor = monitor;
        this.processor = processor;
        this.storage = storage;
    }

    public getStorage(): Contracts.P2P.PeerStorage {
        return this.storage;
    }

    public getProcessor(): Contracts.P2P.PeerProcessor {
        return this.processor;
    }

    public getConnector(): Contracts.P2P.PeerConnector {
        return this.connector;
    }

    public getCommunicator(): Contracts.P2P.PeerCommunicator {
        return this.communicator;
    }

    public getMonitor(): Contracts.P2P.NetworkMonitor {
        return this.monitor;
    }
}
