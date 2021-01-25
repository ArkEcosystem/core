import "jest-extended";

import { Application, Container, Providers, Services } from "@arkecosystem/core-kernel";
import { Peer } from "@arkecosystem/core-p2p/src/peer";
import { ServiceProvider } from "@arkecosystem/core-p2p/src/service-provider";
import { AnySchema } from "@hapi/joi";

describe("ServiceProvider", () => {
    const serverSymbol = Symbol.for("P2P<Server>");

    let app: Application;
    let serviceProvider: ServiceProvider;

    const logger = { warning: jest.fn(), debug: jest.fn() };
    const triggerService = { bind: jest.fn() };
    const mockServer = { boot: jest.fn(), dispose: jest.fn(), initialize: jest.fn() };
    const appGet = {
        [Container.Identifiers.PeerNetworkMonitor]: { initialize: jest.fn() },
        [Container.Identifiers.PeerProcessor]: { initialize: jest.fn() },
        [Container.Identifiers.PeerCommunicator]: { initialize: jest.fn() },
        [Container.Identifiers.PeerEventListener]: { initialize: jest.fn() },
        [serverSymbol]: mockServer,
        [Container.Identifiers.TriggerService]: triggerService,
    };
    let factoryBound;
    const appBind = {
        to: () => ({ inSingletonScope: () => {} }),
        toFactory: (factoryFn) => {
            factoryBound = factoryFn;
        },
    };
    let application = {
        bind: (key) => appBind,
        get: (key) => appGet[key],
    };

    beforeEach(() => {
        application = {
            bind: (key) => appBind,
            get: (key) => appGet[key],
        };

        app = new Application(new Container.Container());

        app.container.unbindAll();
        app.bind(Container.Identifiers.LogService).toConstantValue(logger);
        app.bind(Container.Identifiers.TriggerService).toConstantValue(triggerService);
        app.bind(Container.Identifiers.Application).toConstantValue(application);
        app.bind(Container.Identifiers.PluginConfiguration).to(Providers.PluginConfiguration).inSingletonScope();
        app.bind(Container.Identifiers.ConfigRepository).to(Services.Config.ConfigRepository).inSingletonScope();

        serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);

        const pluginConfiguration = app.resolve<Providers.PluginConfiguration>(Providers.PluginConfiguration);
        pluginConfiguration.from("core-p2p", {
            // @ts-ignore
            server: {
                port: "4005",
            },
        });
        serviceProvider.setConfig(pluginConfiguration);

        jest.resetAllMocks();
    });

    describe("register", () => {
        it("should register factories, services, actions, and build server", async () => {
            const spyBind = jest.spyOn(application, "bind");

            await serviceProvider.register();

            const Identifiers = Container.Identifiers;
            for (const identifier of [
                Identifiers.PeerFactory,
                Identifiers.PeerStorage,
                Identifiers.PeerConnector,
                Identifiers.PeerCommunicator,
                Identifiers.PeerProcessor,
                Identifiers.PeerNetworkMonitor,
                Identifiers.PeerTransactionBroadcaster,
                Identifiers.PeerEventListener,
            ]) {
                expect(spyBind).toBeCalledWith(identifier);
            }

            expect(triggerService.bind).toBeCalledWith("validateAndAcceptPeer", expect.anything());

            expect(spyBind).toBeCalledWith(serverSymbol);
            expect(mockServer.initialize).toBeCalledTimes(1);

            // factory bound should be peer factory, testing it
            const ip = "188.133.1.2";
            const testPeer = factoryBound()(ip);
            expect(testPeer).toBeInstanceOf(Peer);
        });

        it("should not build server when process.env.DISABLE_P2P_SERVER", async () => {
            process.env.DISABLE_P2P_SERVER = "true";
            const spyBind = jest.spyOn(application, "bind");

            await serviceProvider.register();

            expect(spyBind).not.toBeCalledWith(serverSymbol);
            expect(mockServer.initialize).toBeCalledTimes(0);

            delete process.env.DISABLE_P2P_SERVER;
        });
    });

    describe("bootWhen", () => {
        it("should return false when process.env.DISABLE_P2P_SERVER", async () => {
            process.env.DISABLE_P2P_SERVER = "true";
            expect(await serviceProvider.bootWhen()).toBeFalse();
            delete process.env.DISABLE_P2P_SERVER; // reset to initial undefined value
        });

        it("should return true when !process.env.DISABLE_P2P_SERVER", async () => {
            expect(await serviceProvider.bootWhen()).toBeTrue();
        });
    });
    describe("boot", () => {
        it("should call the server boot method", async () => {
            await serviceProvider.boot();

            expect(mockServer.boot).toBeCalledTimes(1);
        });
    });
    describe("dispose", () => {
        it("should call the server dispose method when !process.env.DISABLE_P2P_SERVER", async () => {
            await serviceProvider.dispose();

            expect(mockServer.dispose).toBeCalledTimes(1);
        });

        it("should not call the server dispose method when process.env.DISABLE_P2P_SERVER", async () => {
            process.env.DISABLE_P2P_SERVER = "true";

            await serviceProvider.dispose();

            expect(mockServer.dispose).toBeCalledTimes(0);
            delete process.env.DISABLE_P2P_SERVER; // reset to initial undefined value
        });
    });
    describe("required", () => {
        it("should return true", async () => {
            expect(await serviceProvider.required()).toBeTrue();
        });
    });
    describe("peerFactory", () => {
        it("should create a peer with integer port number, when using string config", async () => {
            await serviceProvider.register();
            const ip = "188.133.1.2";
            const testPeer = factoryBound()(ip);
            expect(testPeer).toBeInstanceOf(Peer);
            expect(typeof testPeer.port).toBe("number");
            expect(testPeer.port).toEqual(4005);
        });
    });

    describe("configSchema", () => {
        beforeEach(() => {
            serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);

            for (const key of Object.keys(process.env)) {
                if (key.includes("CORE_P2P_")) {
                    delete process.env[key];
                }
            }
        });

        it("should validate schema using defaults", async () => {
            jest.resetModules();
            const result = (serviceProvider.configSchema() as AnySchema).validate(
                (await import("@packages/core-p2p/src/defaults")).defaults,
            );

            expect(result.error).toBeUndefined();

            expect(result.value.server.hostname).toBeString();
            expect(result.value.server.port).toBeNumber();
            expect(result.value.server.logLevel).toBeNumber();

            expect(result.value.minimumVersions).toBeArray();
            result.value.minimumVersions.forEach((item) => {
                expect(item).toBeString();
            });

            expect(result.value.minimumNetworkReach).toBeNumber();
            expect(result.value.verifyTimeout).toBeNumber();
            expect(result.value.getBlocksTimeout).toBeNumber();
            expect(result.value.maxPeersBroadcast).toBeNumber();
            expect(result.value.maxSameSubnetPeers).toBeNumber();
            expect(result.value.maxPeerSequentialErrors).toBeNumber();

            expect(result.value.whitelist).toBeArray();
            result.value.whitelist.forEach((item) => {
                expect(item).toBeString();
            });

            expect(result.value.blacklist).toBeArray();
            result.value.blacklist.forEach((item) => {
                expect(item).toBeString();
            });

            expect(result.value.remoteAccess).toBeArray();
            result.value.remoteAccess.forEach((item) => {
                expect(item).toBeString();
            });

            expect(result.value.dns).toBeArray();
            result.value.dns.forEach((item) => {
                expect(item).toBeString();
            });

            expect(result.value.ntp).toBeArray();
            result.value.ntp.forEach((item) => {
                expect(item).toBeString();
            });

            expect(result.value.rateLimit).toBeNumber();

            expect(result.value.networkStart).toBeUndefined();
            expect(result.value.disableDiscovery).toBeUndefined();
            expect(result.value.skipDiscovery).toBeUndefined();
            expect(result.value.ignoreMinimumNetworkReach).toBeUndefined();
        });

        describe("process.env.CORE_P2P_HOST", () => {
            it("should parse process.env.CORE_P2P_HOST", async () => {
                process.env.CORE_P2P_HOST = "127.0.0.1";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-p2p/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.server.hostname).toEqual("127.0.0.1");
            });

            it("should throw if process.env.CORE_MONITOR_PUBLIC_IP is not ipv4 or ipv6 address", async () => {
                process.env.CORE_P2P_HOST = "123";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-p2p/src/defaults")).defaults,
                );

                expect(result.error).toBeDefined();
                expect(result.error!.message).toEqual(
                    '"server.hostname" must be a valid ip address of one of the following versions [ipv4, ipv6] with a optional CIDR',
                );
            });
        });

        describe("process.env.CORE_P2P_PORT", () => {
            it("should parse process.env.CORE_P2P_PORT", async () => {
                process.env.CORE_P2P_PORT = "5000";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-p2p/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.server.port).toEqual(5000);
            });

            it("should throw if process.env.CORE_P2P_PORT is not number", async () => {
                process.env.CORE_P2P_PORT = "false";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-p2p/src/defaults")).defaults,
                );

                expect(result.error).toBeDefined();
                expect(result.error!.message).toEqual('"server.port" must be a number');
            });
        });

        describe("process.env.CORE_NETWORK_NAME", () => {
            it("should return 1 if process.env.CORE_NETWORK_NAME is testnet", async () => {
                process.env.CORE_NETWORK_NAME = "testnet";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-p2p/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.server.logLevel).toEqual(1);
            });

            it("should return 0 if process.env.CORE_NETWORK_NAME is not testnet", async () => {
                process.env.CORE_NETWORK_NAME = "devnet";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-p2p/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.server.logLevel).toEqual(0);
            });
        });

        describe("process.env.CORE_P2P_MAX_PEERS_SAME_SUBNET", () => {
            it("should parse process.env.CORE_P2P_MAX_PEERS_SAME_SUBNET", async () => {
                process.env.CORE_P2P_MAX_PEERS_SAME_SUBNET = "5000";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-p2p/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.maxSameSubnetPeers).toEqual(5000);
            });

            it("should throw if process.env.CORE_P2P_MAX_PEERS_SAME_SUBNET is not number", async () => {
                process.env.CORE_P2P_MAX_PEERS_SAME_SUBNET = "false";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-p2p/src/defaults")).defaults,
                );

                expect(result.error).toBeDefined();
                expect(result.error!.message).toEqual('"maxSameSubnetPeers" must be a number');
            });
        });

        describe("process.env.CORE_P2P_MAX_PEER_SEQUENTIAL_ERRORS", () => {
            it("should parse process.env.CORE_P2P_MAX_PEER_SEQUENTIAL_ERRORS", async () => {
                process.env.CORE_P2P_MAX_PEER_SEQUENTIAL_ERRORS = "5000";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-p2p/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.maxPeerSequentialErrors).toEqual(5000);
            });

            it("should throw if process.env.CORE_P2P_MAX_PEER_SEQUENTIAL_ERRORS is not number", async () => {
                process.env.CORE_P2P_MAX_PEER_SEQUENTIAL_ERRORS = "false";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-p2p/src/defaults")).defaults,
                );

                expect(result.error).toBeDefined();
                expect(result.error!.message).toEqual('"maxPeerSequentialErrors" must be a number');
            });
        });

        describe("process.env.CORE_P2P_RATE_LIMIT", () => {
            it("should parse process.env.CORE_P2P_RATE_LIMIT", async () => {
                process.env.CORE_P2P_RATE_LIMIT = "5000";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-p2p/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.rateLimit).toEqual(5000);
            });

            it("should throw if process.env.CORE_P2P_RATE_LIMIT is not number", async () => {
                process.env.CORE_P2P_RATE_LIMIT = "false";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-p2p/src/defaults")).defaults,
                );

                expect(result.error).toBeDefined();
                expect(result.error!.message).toEqual('"rateLimit" must be a number');
            });
        });
    });
});
