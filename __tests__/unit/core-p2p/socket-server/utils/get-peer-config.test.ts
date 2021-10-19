import { Container } from "@arkecosystem/core-kernel";
import { getPeerConfig } from "@arkecosystem/core-p2p/src/socket-server/utils/get-peer-config";
import { Managers } from "@arkecosystem/crypto";

let mockConfig;
let version;
let appPlugins;
let coreApiServiceProviderConfiguration;
let coreApiServiceProvider;
let coreWebhooksServiceProvider;
let coreP2PServiceProvider;
let serviceProviders;
let app;
let result;

beforeEach(() => {
    mockConfig = {
        "network.pubKeyHash": "pubkyhash",
        "network.name": "thechain",
        "network.nethash": "nethahs",
        "network.client.explorer": "explorer.thechain.com",
        "network.client.token": "TCHAIN",
        "network.client.symbol": "TCH",
    };
    jest.spyOn(Managers.configManager, "get").mockImplementation((key) => mockConfig[key]);

    version = "3.0.9";
    appPlugins = [
        { package: "@arkecosystem/core-api", options: {} },
        { package: "@arkecosystem/core-webhooks" },
        { package: "@arkecosystem/core-p2p" },
    ];

    coreApiServiceProvider = {
        name: () => "core-api",
        config: () => ({
            all: () => coreApiServiceProviderConfiguration,
        }),
    };
    coreWebhooksServiceProvider = {
        name: () => "core-webhooks",
        config: () => ({
            all: () => ({
                enabled: true,
                server: {
                    http: {
                        port: 4004,
                    },
                },
            }),
        }),
    };
    coreP2PServiceProvider = {
        name: () => "core-p2p",
        config: () => ({
            all: () => ({}),
        }),
    };
    serviceProviders = {
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

    app = {
        version: () => version,
        get: (key) => appGet[key],
    };

    result = {
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
    };
});

describe("getPeerConfig", () => {
    it("should omit a plugin if it is storing the [port] at the root of the options", () => {
        coreApiServiceProviderConfiguration = {
            enabled: true,
            port: 4003,
        };

        delete result.plugins["@arkecosystem/core-api"];
        expect(getPeerConfig(app)).toEqual(result);
    });

    it("should omit a plugin if it is storing the [port] in the [options] key", () => {
        coreApiServiceProviderConfiguration = {
            enabled: true,
            options: {
                port: 4003,
            },
        };

        delete result.plugins["@arkecosystem/core-api"];
        expect(getPeerConfig(app)).toEqual(result);
    });

    it("should omit a plugin if it is storing the [port] in the [server] object", () => {
        coreApiServiceProviderConfiguration = {
            enabled: true,
            server: {
                port: 4003,
            },
        };

        delete result.plugins["@arkecosystem/core-api"];
        expect(getPeerConfig(app)).toEqual(result);
    });

    it("should accept a plugin if it is storing the [port] in the [server.http] object", () => {
        coreApiServiceProviderConfiguration = {
            enabled: true,
            server: {
                http: {
                    port: 4003,
                }
            },
            options: {
                estimateTotalCount: true
            }
        };

        expect(getPeerConfig(app)).toEqual(result);
    });

    it("should accept a plugin if it is storing the [port] in the [server.https] object", () => {
        coreApiServiceProviderConfiguration = {
            enabled: true,
            server: {
                https: {
                    port: 4003,
                }
            },
            options: {
                estimateTotalCount: true
            }
        };

        expect(getPeerConfig(app)).toEqual(result);
    });

    it("should return plugins enabled value if enabled property is listed in configuration", () => {
        coreApiServiceProviderConfiguration = {
            enabled: false,
            server: {
                http: {
                    port: 4003,
                }
            },
            options: {
                estimateTotalCount: true
            }
        };

        result.plugins["@arkecosystem/core-api"].enabled = false;
        expect(getPeerConfig(app)).toEqual(result);
    });
});
