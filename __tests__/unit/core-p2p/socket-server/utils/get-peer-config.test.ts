import { Container } from "@arkecosystem/core-kernel";
import { getPeerConfig } from "@arkecosystem/core-p2p/src/socket-server/utils/get-peer-config";
import { Managers } from "@arkecosystem/crypto";

describe("getPeerConfig", () => {
    const mockConfig = {
        "network.pubKeyHash": "pubkyhash",
        "network.name": "thechain",
        "network.nethash": "nethahs",
        "network.client.explorer": "explorer.thechain.com",
        "network.client.token": "TCHAIN",
        "network.client.symbol": "TCH",
    };
    jest.spyOn(Managers.configManager, "get").mockImplementation((key) => mockConfig[key]);

    const version = "3.0.9";
    const appPlugins = [
        { package: "@arkecosystem/core-api", options: {} },
        { package: "@arkecosystem/core-webhooks" },
        { package: "@arkecosystem/core-p2p" },
    ];
    const coreApiServiceProvider = {
        name: () => "core-api",
        configDefaults: () => ({
            server: { http: { port: 4003 } },
        }),
    };
    const coreWebhooksServiceProvider = {
        name: () => "core-webhooks",
        configDefaults: () => ({}),
    };
    const coreP2PServiceProvider = {
        name: () => "core-p2p",
        configDefaults: () => ({}),
    };
    const serviceProviders = {
        "@arkecosystem/core-api": coreApiServiceProvider,
        "@arkecosystem/core-webhooks": coreWebhooksServiceProvider,
        "@arkecosystem/core-p2p": coreP2PServiceProvider,
    };
    const configRepository = { get: () => appPlugins }; // get("app.plugins")
    const serviceProviderRepository = { get: (plugin) => serviceProviders[plugin] };
    const appGet = {
        [Container.Identifiers.ConfigRepository]: configRepository,
        [Container.Identifiers.ServiceProviderRepository]: serviceProviderRepository,
    };
    const app = {
        version: () => version,
        get: (key) => appGet[key],
        resolve: () => ({
            from: () => ({
                merge: () => ({
                    all: () => ({
                        server: {
                            http: {
                                port: "4003",
                            },
                        },
                    }),
                }),
            }),
            discover: () => ({
                merge: () => ({
                    all: () => ({
                        server: {
                            port: "4004",
                        },
                    }),
                }),
            }),
        }),
    };

    it("should return own config from config manager", () => {
        expect(getPeerConfig(app as any)).toEqual({
            version,
            network: {
                version: mockConfig["network.pubKeyHash"],
                name: mockConfig["network.name"],
                nethash: mockConfig["network.nethash"],
                explorer: mockConfig["network.client.explorer"],
                token: {
                    name: mockConfig["network.client.token"],
                    symbol: mockConfig["network.client.symbol"],
                },
            },
            plugins: {
                "@arkecosystem/core-api": {
                    enabled: true,
                    estimateTotalCount: true,
                    port: 4003,
                },
                "@arkecosystem/core-webhooks": {
                    enabled: true,
                    port: 4004,
                },
            },
        });
    });
});
