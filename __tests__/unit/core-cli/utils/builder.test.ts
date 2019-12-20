import { buildPeerFlags } from "@packages/core-cli/src/utils/builder";

describe("buildPeerFlags", () => {
    it("should build the configuration object", () => {
        const flags = {
            networkStart: "networkStart",
            disableDiscovery: "disableDiscovery",
            skipDiscovery: "skipDiscovery",
            ignoreMinimumNetworkReach: "ignoreMinimumNetworkReach",
        };

        expect(buildPeerFlags(flags)).toEqual(flags);
    });

    it("should handle seed mode", () => {
        const flags = {
            networkStart: "networkStart",
            disableDiscovery: "disableDiscovery",
            skipDiscovery: "skipDiscovery",
            ignoreMinimumNetworkReach: "ignoreMinimumNetworkReach",
        };

        expect(buildPeerFlags({ ...flags, ...{ launchMode: "seed" } })).toEqual({
            ...flags,
            ...{
                skipDiscovery: true,
                ignoreMinimumNetworkReach: true,
            },
        });
    });
});
