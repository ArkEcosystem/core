import { buildApplication, buildPeerFlags } from "@packages/core-cli/src/utils/builder";

const app = {
    bootstrap: jest.fn(),
    boot: jest.fn(),
};

jest.mock("@arkecosystem/core-kernel", () => ({
    __esModule: true,
    Application: jest.fn(() => app),
    Container: {
        Container: jest.fn(),
    },
}));

afterEach(() => jest.resetAllMocks());

describe("buildApplication", () => {
    it("should build an application instance and call bootstrap and boot", async () => {
        const spyBootstrap = jest.spyOn(app, "bootstrap").mockImplementation(undefined);
        const spyBoot = jest.spyOn(app, "boot").mockImplementation(undefined);

        await buildApplication({});

        expect(spyBootstrap).toHaveBeenCalled();
        expect(spyBoot).toHaveBeenCalled();
    });

    it("should build an application instance and not call bootstrap or boot", async () => {
        const spyBootstrap = jest.spyOn(app, "bootstrap").mockImplementation(undefined);
        const spyBoot = jest.spyOn(app, "boot").mockImplementation(undefined);

        await buildApplication();

        expect(spyBootstrap).not.toHaveBeenCalled();
        expect(spyBoot).not.toHaveBeenCalled();
    });
});

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
