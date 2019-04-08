import { getMonitor } from "./p2p/network-monitor";
import { getStorage } from "./p2p/peer-storage";

export const p2p = {
    getStorage: () => getStorage,
    getMonitor: () => getMonitor,
};
