import { Contracts } from "@arkecosystem/core-kernel";

export class PeerService implements Contracts.P2P.IPeerService {
    private readonly communicator: Contracts.P2P.IPeerCommunicator;
    private readonly connector: Contracts.P2P.IPeerConnector;
    private readonly monitor: Contracts.P2P.INetworkMonitor;
    private readonly processor: Contracts.P2P.IPeerProcessor;
    private readonly storage: Contracts.P2P.IPeerStorage;

    public constructor({
        communicator,
        connector,
        monitor,
        processor,
        storage,
    }: {
        communicator: Contracts.P2P.IPeerCommunicator;
        connector: Contracts.P2P.IPeerConnector;
        monitor: Contracts.P2P.INetworkMonitor;
        processor: Contracts.P2P.IPeerProcessor;
        storage: Contracts.P2P.IPeerStorage;
    }) {
        this.communicator = communicator;
        this.connector = connector;
        this.monitor = monitor;
        this.processor = processor;
        this.storage = storage;
    }

    public getStorage(): Contracts.P2P.IPeerStorage {
        return this.storage;
    }

    public getProcessor(): Contracts.P2P.IPeerProcessor {
        return this.processor;
    }

    public getConnector(): Contracts.P2P.IPeerConnector {
        return this.connector;
    }

    public getCommunicator(): Contracts.P2P.IPeerCommunicator {
        return this.communicator;
    }

    public getMonitor(): Contracts.P2P.INetworkMonitor {
        return this.monitor;
    }
}
