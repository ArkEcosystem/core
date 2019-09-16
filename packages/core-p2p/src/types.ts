import { PeerConnector } from "./peer-connector";
import { PeerStorage } from "./peer-storage";
import { PeerCommunicator } from "./peer-communicator";
import { PeerProcessor } from "./peer-processor";
import { NetworkMonitor } from "./network-monitor";

export interface PeerService {
    connector: PeerConnector;
    storage: PeerStorage;
    communicator: PeerCommunicator;
    processor: PeerProcessor;
    networkMonitor: NetworkMonitor;
}
