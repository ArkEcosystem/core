import { P2P } from "@arkecosystem/core-interfaces";

export class PeerService implements P2P.IPeerService {
    public constructor(
        private readonly storage: P2P.IPeerStorage,
        private readonly processor: P2P.IPeerProcessor,
        private readonly connector: P2P.IPeerConnector,
        private readonly communicator: P2P.IPeerCommunicator,
        private readonly monitor: P2P.INetworkMonitor,
        private readonly guard: P2P.IPeerGuard,
    ) {}

    public getStorage(): P2P.IPeerStorage {
        return this.storage;
    }

    public getProcessor(): P2P.IPeerProcessor {
        return this.processor;
    }

    public getConnector(): P2P.IPeerConnector {
        return this.connector;
    }

    public getCommunicator(): P2P.IPeerCommunicator {
        return this.communicator;
    }

    public getMonitor(): P2P.INetworkMonitor {
        return this.monitor;
    }

    public getGuard(): P2P.IPeerGuard {
        return this.guard;
    }
}
