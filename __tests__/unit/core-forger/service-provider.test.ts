import "jest-extended";

import { ServiceProvider } from "@packages/core-forger/src";
import { Client } from "@packages/core-forger/src/client";
import { DelegateTracker } from "@packages/core-forger/src/delegate-tracker";
import { ForgerService } from "@packages/core-forger/src/forger-service";
import { Application, Container, Contracts, Enums, Providers } from "@packages/core-kernel";
import { Wallet } from "@packages/core-state/src/wallets";
import { Identities } from "@packages/crypto";
import socketCluster from "socketcluster-client";

jest.mock("socketcluster-client");

afterAll(() => jest.clearAllMocks());

const initializeClient = (client: Client) => {
    const mockHost = {
        socket: {
            on: () => {},
            disconnect: () => {},
            emit: () => {},
            getState: () => "open",
            OPEN: "open",
        },
        port: 4000,
        hostname: "mock-1",
    };
    const socketClusterSpy = jest.spyOn(socketCluster, "create");
    // @ts-ignore
    socketClusterSpy.mockImplementation(() => mockHost.socket);
    // @ts-ignore
    client.register([mockHost]);
    return mockHost;
};

const calculateActiveDelegates = (): Wallet[] => {
    const activeDelegates = [];
    for (let i = 0; i < 51; i++) {
        const address = `Delegate-Wallet-${i}`;
        const wallet = new Wallet(address, null);
        wallet.publicKey = Identities.PublicKey.fromPassphrase(address);

        activeDelegates.push(wallet);
    }
    return activeDelegates;
};

describe("ServiceProvider", () => {
    it("should fail to register when mock options are now set", async () => {
        const app: Application = new Application(new Container.Container());

        app.bind(Container.Identifiers.PluginConfiguration).to(Providers.PluginConfiguration).inSingletonScope();

        const logger = {
            error: jest.fn(),
            debug: jest.fn(),
            info: jest.fn(),
            warning: jest.fn(),
        };

        app.bind(Container.Identifiers.LogService).toConstantValue(logger);

        const serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);

        const pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);

        app.resolve<ForgerService>(ForgerService);
        app.resolve<Client>(Client);

        // @ts-ignore
        const instance: Providers.PluginConfiguration = pluginConfiguration.from("core-forger", {});

        serviceProvider.setConfig(instance);

        await expect(serviceProvider.register()).toReject();
    });

    it("should register with the correct config", async () => {
        const app: Application = new Application(new Container.Container());

        app.bind(Container.Identifiers.PluginConfiguration).to(Providers.PluginConfiguration).inSingletonScope();

        const logger = {
            error: jest.fn(),
            debug: jest.fn(),
            info: jest.fn(),
            warning: jest.fn(),
        };

        app.bind(Container.Identifiers.LogService).toConstantValue(logger);

        const serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);

        const pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);

        app.resolve<ForgerService>(ForgerService);
        const client = app.resolve<Client>(Client);
        const mockHost = initializeClient(client);

        // @ts-ignore
        const instance: Providers.PluginConfiguration = pluginConfiguration.from("core-forger", { hosts: [mockHost] });

        serviceProvider.setConfig(instance);

        await expect(serviceProvider.register()).toResolve();
    });

    it("boot should set bip 39 delegates and start tracker", async () => {
        const app: Application = new Application(new Container.Container());

        app.bind(Container.Identifiers.PluginConfiguration).to(Providers.PluginConfiguration).inSingletonScope();

        const logger = {
            error: jest.fn(),
            debug: jest.fn(),
            info: jest.fn(),
            warning: jest.fn(),
        };

        app.bind(Container.Identifiers.LogService).toConstantValue(logger);

        const serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);

        const pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);

        app.resolve<ForgerService>(ForgerService);
        const client = app.resolve<Client>(Client);
        const mockHost = initializeClient(client);

        const instance: Providers.PluginConfiguration = pluginConfiguration.from("core-forger", {
            // @ts-ignore
            hosts: [mockHost],
        });

        serviceProvider.setConfig(instance);

        app.config(
            "delegates.secrets",
            calculateActiveDelegates().map((delegate) => delegate.publicKey),
        );

        app.config("app.flags", {
            bip38: false,
            password: null,
        });

        await expect(serviceProvider.register()).toResolve();
        await expect(serviceProvider.boot()).toResolve();
    });

    it("boot should set bip 38 delegates and start tracker", async () => {
        const app: Application = new Application(new Container.Container());

        app.bind(Container.Identifiers.PluginConfiguration).to(Providers.PluginConfiguration).inSingletonScope();

        const logger = {
            error: jest.fn(),
            debug: jest.fn(),
            info: jest.fn(),
            warning: jest.fn(),
        };

        app.bind(Container.Identifiers.LogService).toConstantValue(logger);

        const serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);

        const pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);

        app.resolve<ForgerService>(ForgerService);
        const client = app.resolve<Client>(Client);
        const mockHost = initializeClient(client);

        const instance: Providers.PluginConfiguration = pluginConfiguration.from("core-forger", {
            // @ts-ignore
            hosts: [mockHost],
        });

        serviceProvider.setConfig(instance);

        app.config("delegates.secrets", []);

        const bip38: string = "6PYTQC4c2vBv6PGvV4HibNni6wNsHsGbR1qpL1DfkCNihsiWwXnjvJMU4B";

        app.config("app.flags", {
            bip38,
            password: "bip38-password",
        });

        await expect(serviceProvider.register()).toResolve();
        await expect(serviceProvider.boot()).toResolve();
    });

    it("boot should start tracker and emit event", async () => {
        const app: Application = new Application(new Container.Container());

        const mockLastBlock = {
            data: { height: 3, timestamp: 111150 },
        };

        @Container.injectable()
        class MockDatabaseService {
            public async getActiveDelegates(): Promise<Wallet[]> {
                return [];
            }
        }

        @Container.injectable()
        class MockWalletRepository {
            public findByPublicKey(publicKey: string) {
                return {
                    getAttribute: () => [],
                };
            }
        }

        @Container.injectable()
        class MockBlockchainService {
            public getLastBlock() {
                return mockLastBlock;
            }
        }

        app.bind(Container.Identifiers.DatabaseService).to(MockDatabaseService);

        app.bind(Container.Identifiers.BlockchainService).to(MockBlockchainService);

        app.bind(Container.Identifiers.WalletRepository).to(MockWalletRepository);

        app.bind(Container.Identifiers.PluginConfiguration).to(Providers.PluginConfiguration).inSingletonScope();

        const logger = {
            error: jest.fn(),
            debug: jest.fn(),
            info: jest.fn(),
            warning: jest.fn(),
        };

        app.bind(Container.Identifiers.LogService).toConstantValue(logger);

        const serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);

        const pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);

        app.resolve<ForgerService>(ForgerService);
        const client = app.resolve<Client>(Client);
        const mockHost = initializeClient(client);

        const instance: Providers.PluginConfiguration = pluginConfiguration.from("core-forger", {
            // @ts-ignore
            hosts: [mockHost],
            tracker: true,
        });

        serviceProvider.setConfig(instance);

        app.config(
            "delegates.secrets",
            calculateActiveDelegates().map((delegate) => delegate.publicKey),
        );

        app.config("app.flags", {
            bip38: false,
            password: null,
        });

        const spyListen = jest.fn();

        const mockEventDispatcher = {
            listen: spyListen,
        };

        app.bind<Contracts.Kernel.EventDispatcher>(Container.Identifiers.EventDispatcherService).toConstantValue(
            // @ts-ignore
            mockEventDispatcher,
        );

        await expect(serviceProvider.register()).toResolve();
        await expect(serviceProvider.boot()).toResolve();

        expect(spyListen).toHaveBeenCalledWith(Enums.BlockEvent.Applied, expect.any(DelegateTracker));
    });

    it("boot should not initialise delegate tracker when there are no delegates", async () => {
        const app: Application = new Application(new Container.Container());

        const mockLastBlock = {
            data: { height: 3, timestamp: 111150 },
        };

        @Container.injectable()
        class MockDatabaseService {
            public async getActiveDelegates(): Promise<Wallet[]> {
                return [];
            }
        }

        @Container.injectable()
        class MockWalletRepository {
            public findByPublicKey(publicKey: string) {
                return {
                    getAttribute: () => [],
                };
            }
        }

        @Container.injectable()
        class MockBlockchainService {
            public getLastBlock() {
                return mockLastBlock;
            }
        }

        app.bind(Container.Identifiers.DatabaseService).to(MockDatabaseService);

        app.bind(Container.Identifiers.BlockchainService).to(MockBlockchainService);

        app.bind(Container.Identifiers.WalletRepository).to(MockWalletRepository);

        app.bind(Container.Identifiers.PluginConfiguration).to(Providers.PluginConfiguration).inSingletonScope();

        const logger = {
            error: jest.fn(),
            debug: jest.fn(),
            info: jest.fn(),
            warning: jest.fn(),
        };

        app.bind(Container.Identifiers.LogService).toConstantValue(logger);

        const serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);

        const pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);

        app.resolve<ForgerService>(ForgerService);
        const client = app.resolve<Client>(Client);
        const mockHost = initializeClient(client);

        const instance: Providers.PluginConfiguration = pluginConfiguration.from("core-forger", {
            // @ts-ignore
            hosts: [mockHost],
            tracker: true,
        });

        serviceProvider.setConfig(instance);

        app.config("delegates.secrets", []);

        app.config("app.flags", {
            bip38: false,
            password: null,
        });

        const spyListen = jest.fn();

        const mockEventDispatcher = {
            listen: spyListen,
        };

        app.bind<Contracts.Kernel.EventDispatcher>(Container.Identifiers.EventDispatcherService).toConstantValue(
            // @ts-ignore
            mockEventDispatcher,
        );

        await expect(serviceProvider.register()).toResolve();
        await expect(serviceProvider.boot()).toResolve();

        expect(spyListen).not.toHaveBeenCalled();
    });

    it("bootWhen should return true for bip 39 config", async () => {
        const app: Application = new Application(new Container.Container());

        app.bind(Container.Identifiers.PluginConfiguration).to(Providers.PluginConfiguration).inSingletonScope();

        const logger = {
            error: jest.fn(),
            debug: jest.fn(),
            info: jest.fn(),
            warning: jest.fn(),
        };

        app.bind(Container.Identifiers.LogService).toConstantValue(logger);

        const serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);

        const pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);

        app.resolve<ForgerService>(ForgerService);
        const client = app.resolve<Client>(Client);
        const mockHost = initializeClient(client);

        const instance: Providers.PluginConfiguration = pluginConfiguration.from("core-forger", {
            // @ts-ignore
            hosts: [mockHost],
        });

        serviceProvider.setConfig(instance);

        app.config(
            "delegates.secrets",
            calculateActiveDelegates().map((delegate) => delegate.publicKey),
        );

        app.config("app.flags", {
            bip38: false,
            password: null,
        });

        await expect(serviceProvider.register()).toResolve();
        await expect(serviceProvider.bootWhen()).resolves.toEqual(true);
    });

    it("bootWhen should return false for bip 38 config", async () => {
        const app: Application = new Application(new Container.Container());

        app.bind(Container.Identifiers.PluginConfiguration).to(Providers.PluginConfiguration).inSingletonScope();

        const logger = {
            error: jest.fn(),
            debug: jest.fn(),
            info: jest.fn(),
            warning: jest.fn(),
        };

        app.bind(Container.Identifiers.LogService).toConstantValue(logger);

        const serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);

        const pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);

        app.resolve<ForgerService>(ForgerService);
        const client = app.resolve<Client>(Client);
        const mockHost = initializeClient(client);

        const instance: Providers.PluginConfiguration = pluginConfiguration.from("core-forger", {
            // @ts-ignore
            hosts: [mockHost],
        });

        serviceProvider.setConfig(instance);

        app.config("delegates.secrets", []);

        const bip38: string = "6PYTQC4c2vBv6PGvV4HibNni6wNsHsGbR1qpL1DfkCNihsiWwXnjvJMU4B";

        app.config("app.flags", {
            bip38,
            password: "bip38-password",
        });

        await expect(serviceProvider.register()).toResolve();
        await expect(serviceProvider.bootWhen()).resolves.toEqual(false);
    });

    it("dispose should of the ForgerService properly", async () => {
        const app: Application = new Application(new Container.Container());

        const mockLastBlock = {
            data: { height: 3, timestamp: 111150 },
        };

        @Container.injectable()
        class MockDatabaseService {
            public async getActiveDelegates(): Promise<Wallet[]> {
                return [];
            }
        }

        @Container.injectable()
        class MockWalletRepository {
            public findByPublicKey(publicKey: string) {
                return {
                    getAttribute: () => [],
                };
            }
        }

        @Container.injectable()
        class MockBlockchainService {
            public getLastBlock() {
                return mockLastBlock;
            }
        }

        app.bind(Container.Identifiers.DatabaseService).to(MockDatabaseService);

        app.bind(Container.Identifiers.BlockchainService).to(MockBlockchainService);

        app.bind(Container.Identifiers.WalletRepository).to(MockWalletRepository);

        app.bind(Container.Identifiers.PluginConfiguration).to(Providers.PluginConfiguration).inSingletonScope();

        const logger = {
            error: jest.fn(),
            debug: jest.fn(),
            info: jest.fn(),
            warning: jest.fn(),
        };

        app.bind(Container.Identifiers.LogService).toConstantValue(logger);

        const serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);

        const pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);

        app.resolve<ForgerService>(ForgerService);
        const client = app.resolve<Client>(Client);
        const mockHost = initializeClient(client);

        const instance: Providers.PluginConfiguration = pluginConfiguration.from("core-forger", {
            // @ts-ignore
            hosts: [mockHost],
            tracker: true,
        });

        serviceProvider.setConfig(instance);

        app.config(
            "delegates.secrets",
            calculateActiveDelegates().map((delegate) => delegate.publicKey),
        );

        app.config("app.flags", {
            bip38: false,
            password: null,
        });

        const spyListen = jest.fn();

        const mockEventDispatcher = {
            listen: spyListen,
        };

        app.bind<Contracts.Kernel.EventDispatcher>(Container.Identifiers.EventDispatcherService).toConstantValue(
            // @ts-ignore
            mockEventDispatcher,
        );

        await expect(serviceProvider.register()).toResolve();
        await expect(serviceProvider.boot()).toResolve();

        const forger = app.get<ForgerService>(Container.Identifiers.ForgerService);
        const spyForgerDispose = jest.spyOn(forger, "dispose");

        await expect(serviceProvider.dispose()).toResolve();
        await expect(spyForgerDispose).toHaveBeenCalled();
    });
});
