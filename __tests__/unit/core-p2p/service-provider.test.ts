import { Container, Application, Providers, Services } from "@arkecosystem/core-kernel";

import { ServiceProvider } from "@arkecosystem/core-p2p/src/service-provider";
import { Peer } from "@arkecosystem/core-p2p/src/peer";

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
        [serverSymbol]: mockServer,
        [Container.Identifiers.TriggerService]: triggerService,
    };
    let factoryBound; 
    const appBind = {
        to: () => ({ inSingletonScope: () => {} }),
        toFactory: (factoryFn) => { factoryBound = factoryFn },
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
            server: {},
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
                "p2p.event-listener",
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
});
