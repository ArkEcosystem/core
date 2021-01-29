import { Contracts } from "@arkecosystem/core-kernel";

export type PeerFactory = (ip: string) => Contracts.P2P.Peer;

export interface PeerService {
    connector: Contracts.P2P.PeerConnector;
    repository: Contracts.P2P.PeerRepository;
    communicator: Contracts.P2P.PeerCommunicator;
    processor: Contracts.P2P.PeerProcessor;
    networkMonitor: Contracts.P2P.NetworkMonitor;
}
