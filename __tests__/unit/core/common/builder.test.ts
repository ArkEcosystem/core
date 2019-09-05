import { buildPeerOptions } from "@packages/core/src/common/builder";

describe("buildPeerOptions", () => {
    it("should build the configuration object", () => {
        const flags = {
            networkStart: "networkStart",
            disableDiscovery: "disableDiscovery",
            skipDiscovery: "skipDiscovery",
            ignoreMinimumNetworkReach: "ignoreMinimumNetworkReach",
        };

        expect(buildPeerOptions(flags)).toEqual(flags);
    });

    it("should handle seed mode", () => {
        const flags = {
            networkStart: "networkStart",
            disableDiscovery: "disableDiscovery",
            skipDiscovery: "skipDiscovery",
            ignoreMinimumNetworkReach: "ignoreMinimumNetworkReach",
        };

        expect(buildPeerOptions({ ...flags, ...{ launchMode: "seed" } })).toEqual({
            ...flags,
            ...{
                skipDiscovery: true,
                ignoreMinimumNetworkReach: true,
            },
        });
    });
});
