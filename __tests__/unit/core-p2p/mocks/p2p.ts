import { getMonitor } from "./p2p/network-monitor";
import { getProcessor } from "./p2p/peer-processor";
import { getStorage } from "./p2p/peer-storage";

export const p2p = {
    getMonitor: () => getMonitor,
    getStorage: () => getStorage,
    getProcessor: () => getProcessor,
};
