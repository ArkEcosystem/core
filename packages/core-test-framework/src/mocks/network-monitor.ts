import { NetworkMonitor } from "@arkecosystem/core-p2p/src/network-monitor";
let mockNetworkHeight: number = 0;

export const setNetworkHeight = (networkHeight: number) => {
    mockNetworkHeight = networkHeight;
};

export const instance: Partial<NetworkMonitor> = {
    getNetworkHeight: (): number => {
        return mockNetworkHeight;
    },
};
