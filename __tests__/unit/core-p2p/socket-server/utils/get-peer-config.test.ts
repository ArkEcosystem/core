import { Container } from "@arkecosystem/core-kernel";
import { getPeerConfig } from "@arkecosystem/core-p2p/src/socket-server/utils/get-peer-config";
import { Managers } from "@arkecosystem/crypto";

let mockConfig;
let version;
let appPlugins;
let coreApiServiceProvider;
let coreWebhooksServiceProvider;
let coreP2PServiceProvider;
let serviceProviders;
let mergedConfiguration;
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
        configDefaults: () => ({
            server: { http: { port: 4003 } },
        }),
    };
    coreWebhooksServiceProvider = {
        name: () => "core-webhooks",
        configDefaults: () => ({}),
    };
    coreP2PServiceProvider = {
        name: () => "core-p2p",
        configDefaults: () => ({}),
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

    mergedConfiguration = {
        server: {
            http: {
                port: "4003",
            },
        },
        options: {
            estimateTotalCount: true,
        },
    };

    app = {
        version: () => version,
        get: (key) => appGet[key],
        resolve: () => ({
            from: () => ({
                merge: () => ({
                    all: () => mergedConfiguration,
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
    }
})

describe("getPeerConfig", () => {


    it("should return own config from config manager", () => {
        expect(getPeerConfig(app as any)).toEqual(result);
    });

    it("should return own config from config manager if using options.server.https configuration", () => {
        // @ts-ignore
        mergedConfiguration.server.https = mergedConfiguration.server.http;
        delete mergedConfiguration.server.http;

        expect(getPeerConfig(app as any)).toEqual(result);
    });

    it("should return own config from config manager if using options.server configuration", () => {
        // @ts-ignore
        mergedConfiguration.server.port = mergedConfiguration.server.http.port;
        delete mergedConfiguration.server.http;

        expect(getPeerConfig(app as any)).toEqual(result);
    });

    it("should return own config from config manager if using options configuration", () => {
        // @ts-ignore
        mergedConfiguration.port = mergedConfiguration.server.http.port;
        delete mergedConfiguration.server;

        expect(getPeerConfig(app as any)).toEqual(result);
    });

    it("should return own config from config manager without configuration", () => {
        // @ts-ignore
        mergedConfiguration = undefined;
        appPlugins[0].options = undefined;

        delete result.plugins["@arkecosystem/core-api"];

        expect(getPeerConfig(app as any)).toEqual(result);
    });
});

