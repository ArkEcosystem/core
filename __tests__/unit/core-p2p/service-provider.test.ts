import "jest-extended";

import { Application, Container, Providers, Services } from "@packages/core-kernel";
import { Peer } from "@packages/core-p2p/src/peer";
import { ServiceProvider } from "@packages/core-p2p/src/service-provider";
import { AnySchema } from "joi";

describe("ServiceProvider", () => {
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
        [Container.Identifiers.P2PServer]: mockServer,
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
                Identifiers.PeerRepository,
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

            expect(spyBind).toBeCalledWith(Container.Identifiers.P2PServer);

            // factory bound should be peer factory, testing it
            const ip = "188.133.1.2";
            const testPeer = factoryBound()(ip);
            expect(testPeer).toBeInstanceOf(Peer);
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
        it("should call the server dispose method when process.env.DISABLE_P2P_SERVER is undefined", async () => {
            await serviceProvider.dispose();

            expect(mockServer.dispose).toBeCalledTimes(1);
        });

        it("should not call the server dispose method when process.env.DISABLE_P2P_SERVER = true", async () => {
            process.env.DISABLE_P2P_SERVER = "true";

            await serviceProvider.dispose();
            expect(mockServer.dispose).not.toHaveBeenCalled();

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

        it("should allow configuration extension", async () => {
            jest.resetModules();
            const defaults = (await import("@packages/core-p2p/src/defaults")).defaults;

            // @ts-ignore
            defaults.customField = "dummy";

            const result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

            expect(result.error).toBeUndefined();
            expect(result.value.customField).toEqual("dummy");
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

            it("should throw if process.env.CORE_P2P_HOST is not ipv4 or ipv6 address", async () => {
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

        describe("process.env.CORE_P2P_MIN_NETWORK_REACH", () => {
            it("should parse process.env.CORE_P2P_MIN_NETWORK_REACH", async () => {
                process.env.CORE_P2P_MIN_NETWORK_REACH = "10";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-p2p/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.minimumNetworkReach).toEqual(10);
            });

            it("should throw if process.env.CORE_P2P_MIN_NETWORK_REACH is not number", async () => {
                process.env.CORE_P2P_MIN_NETWORK_REACH = "false";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-p2p/src/defaults")).defaults,
                );

                expect(result.error).toBeDefined();
                expect(result.error!.message).toEqual('"minimumNetworkReach" must be a number');
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

        describe("process.env.CORE_P2P_RATE_LIMIT_POST_TRANSACTIONS", () => {
            it("should parse process.env.CORE_P2P_RATE_LIMIT_POST_TRANSACTIONS", async () => {
                process.env.CORE_P2P_RATE_LIMIT_POST_TRANSACTIONS = "5000";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-p2p/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.rateLimitPostTransactions).toEqual(5000);
            });

            it("should throw if process.env.CORE_P2P_RATE_LIMIT_POST_TRANSACTIONS is not number", async () => {
                process.env.CORE_P2P_RATE_LIMIT_POST_TRANSACTIONS = "false";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-p2p/src/defaults")).defaults,
                );

                expect(result.error).toBeDefined();
                expect(result.error!.message).toEqual('"rateLimitPostTransactions" must be a number');
            });
        });

        describe("schema restrictions", () => {
            let defaults;

            beforeEach(async () => {
                jest.resetModules();
                defaults = (await import("@packages/core-p2p/src/defaults")).defaults;
            });

            it("server is required && is object", async () => {
                defaults.server = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server" must be of type object');

                delete defaults.server;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server" is required');
            });

            it("server.hostname is required && is string && is IP address", async () => {
                defaults.server.hostname = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.hostname" must be a string');

                defaults.server.hostname = "dummy";
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual(
                    '"server.hostname" must be a valid ip address of one of the following versions [ipv4, ipv6] with a optional CIDR',
                );

                delete defaults.server.hostname;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.hostname" is required');
            });

            it("server.port is required && is integer && >= 1 && <= 65535", async () => {
                defaults.server.port = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.port" must be a number');

                defaults.server.port = 1.12;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.port" must be an integer');

                defaults.server.port = 0;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.port" must be greater than or equal to 1');

                defaults.server.port = 65536;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.port" must be less than or equal to 65535');

                delete defaults.server.port;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.port" is required');
            });

            it("server.logLevel is required && is integer && >= 0", async () => {
                defaults.server.logLevel = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.logLevel" must be a number');

                defaults.server.logLevel = 1.12;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.logLevel" must be an integer');

                defaults.server.logLevel = -1;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.logLevel" must be greater than or equal to 0');

                delete defaults.server.logLevel;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.logLevel" is required');
            });

            it("minimumVersions is required && is array && contains strings", async () => {
                defaults.minimumVersions = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"minimumVersions" must be an array');

                defaults.minimumVersions = [false];
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"minimumVersions[0]" must be a string');

                delete defaults.minimumVersions;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"minimumVersions" is required');
            });

            it("minimumNetworkReach is required && is integer && >= 0", async () => {
                defaults.minimumNetworkReach = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"minimumNetworkReach" must be a number');

                defaults.minimumNetworkReach = 1.12;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"minimumNetworkReach" must be an integer');

                defaults.minimumNetworkReach = -1;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"minimumNetworkReach" must be greater than or equal to 0');

                delete defaults.minimumNetworkReach;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"minimumNetworkReach" is required');
            });

            it("verifyTimeout is required && is integer && >= 0", async () => {
                defaults.verifyTimeout = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"verifyTimeout" must be a number');

                defaults.verifyTimeout = 1.12;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"verifyTimeout" must be an integer');

                defaults.verifyTimeout = -1;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"verifyTimeout" must be greater than or equal to 0');

                delete defaults.verifyTimeout;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"verifyTimeout" is required');
            });

            it("getBlocksTimeout is required && is integer && >= 0", async () => {
                defaults.getBlocksTimeout = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"getBlocksTimeout" must be a number');

                defaults.getBlocksTimeout = 1.12;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"getBlocksTimeout" must be an integer');

                defaults.getBlocksTimeout = -1;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"getBlocksTimeout" must be greater than or equal to 0');

                delete defaults.getBlocksTimeout;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"getBlocksTimeout" is required');
            });

            it("maxPeersBroadcast is required && is integer && >= 0", async () => {
                defaults.maxPeersBroadcast = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"maxPeersBroadcast" must be a number');

                defaults.maxPeersBroadcast = 1.12;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"maxPeersBroadcast" must be an integer');

                defaults.maxPeersBroadcast = -1;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"maxPeersBroadcast" must be greater than or equal to 0');

                delete defaults.maxPeersBroadcast;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"maxPeersBroadcast" is required');
            });

            it("maxSameSubnetPeers is required && is integer && >= 0", async () => {
                defaults.maxSameSubnetPeers = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"maxSameSubnetPeers" must be a number');

                defaults.maxSameSubnetPeers = 1.12;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"maxSameSubnetPeers" must be an integer');

                defaults.maxSameSubnetPeers = -1;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"maxSameSubnetPeers" must be greater than or equal to 0');

                delete defaults.maxSameSubnetPeers;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"maxSameSubnetPeers" is required');
            });

            it("maxPeerSequentialErrors is required && is integer && >= 0", async () => {
                defaults.maxPeerSequentialErrors = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"maxPeerSequentialErrors" must be a number');

                defaults.maxPeerSequentialErrors = 1.12;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"maxPeerSequentialErrors" must be an integer');

                defaults.maxPeerSequentialErrors = -1;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"maxPeerSequentialErrors" must be greater than or equal to 0');

                delete defaults.maxPeerSequentialErrors;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"maxPeerSequentialErrors" is required');
            });

            it("whitelist is required && is array && contains strings", async () => {
                defaults.whitelist = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"whitelist" must be an array');

                defaults.whitelist = [false];
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"whitelist[0]" must be a string');

                delete defaults.whitelist;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"whitelist" is required');
            });

            it("blacklist is required && is array && contains strings", async () => {
                defaults.blacklist = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"blacklist" must be an array');

                defaults.blacklist = [false];
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"blacklist[0]" must be a string');

                delete defaults.blacklist;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"blacklist" is required');
            });

            it("remoteAccess is required && is array && contains IP addresses", async () => {
                defaults.remoteAccess = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"remoteAccess" must be an array');

                defaults.remoteAccess = [false];
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"remoteAccess[0]" must be a string');

                defaults.remoteAccess = ["dummy"];
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual(
                    '"remoteAccess[0]" must be a valid ip address of one of the following versions [ipv4, ipv6] with a optional CIDR',
                );

                delete defaults.remoteAccess;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"remoteAccess" is required');
            });

            it("dns is required && is array && contains IP addresses", async () => {
                defaults.dns = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"dns" must be an array');

                defaults.dns = [false];
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"dns[0]" must be a string');

                defaults.dns = ["dummy"];
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual(
                    '"dns[0]" must be a valid ip address of one of the following versions [ipv4, ipv6] with a optional CIDR',
                );

                delete defaults.dns;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"dns" is required');
            });

            it("ntp is required && is array && contains string", async () => {
                defaults.ntp = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"ntp" must be an array');

                defaults.ntp = [false];
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"ntp[0]" must be a string');

                delete defaults.ntp;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"ntp" is required');
            });

            it("rateLimit is required && is integer && >= 0", async () => {
                defaults.rateLimit = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"rateLimit" must be a number');

                defaults.rateLimit = 1.12;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"rateLimit" must be an integer');

                defaults.rateLimit = 0;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"rateLimit" must be greater than or equal to 1');

                delete defaults.rateLimit;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"rateLimit" is required');
            });

            it("rateLimitPostTransactions is required && is integer && >= 0", async () => {
                defaults.rateLimitPostTransactions = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"rateLimitPostTransactions" must be a number');

                defaults.rateLimitPostTransactions = 1.12;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"rateLimitPostTransactions" must be an integer');

                defaults.rateLimitPostTransactions = 0;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"rateLimitPostTransactions" must be greater than or equal to 1');

                delete defaults.rateLimitPostTransactions;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"rateLimitPostTransactions" is required');
            });

            it("networkStart is optional && is boolean", async () => {
                defaults.networkStart = 123;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"networkStart" must be a boolean');

                delete defaults.networkStart;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error).toBeUndefined();
            });

            it("disableDiscovery is optional && is boolean", async () => {
                defaults.disableDiscovery = 123;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"disableDiscovery" must be a boolean');

                delete defaults.disableDiscovery;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error).toBeUndefined();
            });

            it("skipDiscovery is optional && is boolean", async () => {
                defaults.skipDiscovery = 123;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"skipDiscovery" must be a boolean');

                delete defaults.skipDiscovery;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error).toBeUndefined();
            });

            it("ignoreMinimumNetworkReach is optional && is boolean", async () => {
                defaults.ignoreMinimumNetworkReach = 123;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"ignoreMinimumNetworkReach" must be a boolean');

                delete defaults.ignoreMinimumNetworkReach;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error).toBeUndefined();
            });
        });
    });
});
