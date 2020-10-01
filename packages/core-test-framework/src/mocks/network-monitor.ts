import { NetworkMonitor } from "@arkecosystem/core-p2p";

let mockNetworkHeight: number = 0;

export const setNetworkHeight = (networkHeight: number) => {
    mockNetworkHeight = networkHeight;
};

class NetworkMonitorMock implements Partial<NetworkMonitor> {
    public getNetworkHeight(): number {
        return mockNetworkHeight;
    }
}

export const instance = new NetworkMonitorMock();
