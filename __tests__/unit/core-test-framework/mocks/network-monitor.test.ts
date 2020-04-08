import "jest-extended";

import { NetworkMonitor } from "@packages/core-test-framework/src/mocks";

const clear = () => {
    NetworkMonitor.setNetworkHeight(0);
};

describe("NetworkMonitor", () => {
    describe("default values", () => {
        it("getNetworkHeight should return 0", async () => {
            expect(NetworkMonitor.instance.getNetworkHeight()).toBe(0);
        });
    });

    describe("setNetworkHeight", () => {
        beforeEach(() => {
            clear();

            NetworkMonitor.setNetworkHeight(1);
        });

        it("getNetworkHeight should return 0", async () => {
            expect(NetworkMonitor.instance.getNetworkHeight()).toEqual(1);
        });
    });
});
