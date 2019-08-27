import { NetworkMonitor } from "./network-monitor";
import { PeerCommunicator } from "./peer-communicator";
import { PeerConnector } from "./peer-connector";
import { PeerProcessor } from "./peer-processor";
import { PeerStorage } from "./peer-storage";

export interface PeerService {
    getStorage(): PeerStorage;
    getProcessor(): PeerProcessor;
    getConnector(): PeerConnector;
    getCommunicator(): PeerCommunicator;
    getMonitor(): NetworkMonitor;
}
