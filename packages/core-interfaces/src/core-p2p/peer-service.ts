import { INetworkMonitor } from "./network-monitor";
import { IPeerCommunicator } from "./peer-communicator";
import { IPeerConnector } from "./peer-connector";
import { IPeerProcessor } from "./peer-processor";
import { IPeerStorage } from "./peer-storage";

export interface IPeerService {
    getStorage(): IPeerStorage;
    getProcessor(): IPeerProcessor;
    getConnector(): IPeerConnector;
    getCommunicator(): IPeerCommunicator;
    getMonitor(): INetworkMonitor;
}
