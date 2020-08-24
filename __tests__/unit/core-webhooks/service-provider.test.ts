import "jest-extended";

import { Identifiers, Server, ServiceProvider as CoreApiServiceProvider } from "@packages/core-api/src";
import { defaults } from "@packages/core-api/src/defaults";
import { Application, Container, Providers } from "@packages/core-kernel";
import { NullEventDispatcher } from "@packages/core-kernel/src/services/events/drivers/null";
import { ServiceProvider } from "@packages/core-webhooks/src";
import { defaults as webhooksDefaults } from "@packages/core-webhooks/src/defaults";
import { dirSync, setGracefulCleanup } from "tmp";

let app: Application;

const logger = {
    debug: jest.fn(),
    error: jest.fn(),
    notice: jest.fn(),
};

beforeEach(() => {
    app = new Application(new Container.Container());

    app.bind(Container.Identifiers.PluginConfiguration).to(Providers.PluginConfiguration).inSingletonScope();

    app.bind(Container.Identifiers.StateStore).toConstantValue({});

    app.bind(Container.Identifiers.BlockchainService).toConstantValue({});

    app.bind(Container.Identifiers.DatabaseBlockRepository).toConstantValue({});

    app.bind(Container.Identifiers.DatabaseTransactionRepository).toConstantValue({});

    app.bind(Container.Identifiers.WalletRepository).toConstantValue({});

    app.bind(Container.Identifiers.PeerNetworkMonitor).toConstantValue({});

    app.bind(Container.Identifiers.PeerStorage).toConstantValue({});

    app.bind(Container.Identifiers.DatabaseRoundRepository).toConstantValue({});

    app.bind(Container.Identifiers.TransactionPoolQuery).toConstantValue({});

    app.bind(Container.Identifiers.TransactionPoolProcessorFactory).toConstantValue({});

    app.bind(Container.Identifiers.BlockHistoryService).toConstantValue({});

    app.bind(Container.Identifiers.TransactionHistoryService).toConstantValue({});

    app.bind(Container.Identifiers.TransactionHandlerRegistry).toConstantValue({});

    app.bind(Container.Identifiers.StandardCriteriaService).toConstantValue({});

    app.bind(Container.Identifiers.PaginationService).toConstantValue({});

    app.bind(Container.Identifiers.EventDispatcherService).to(NullEventDispatcher);

    app.bind(Container.Identifiers.LogService).toConstantValue(logger);

    app.bind("path.cache").toConstantValue(dirSync().name);
});

afterAll(() => setGracefulCleanup());

describe("ServiceProvider", () => {
    let serviceProvider: ServiceProvider;
    let coreApiServiceProvider: CoreApiServiceProvider;

    beforeEach(async () => {
        coreApiServiceProvider = app.resolve<CoreApiServiceProvider>(CoreApiServiceProvider);

        const pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);
        const instance: Providers.PluginConfiguration = pluginConfiguration.from("core-api", defaults);

        coreApiServiceProvider.setConfig(instance);

        serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);
    });

    it("should register", async () => {
        await expect(coreApiServiceProvider.register()).toResolve();

        expect(app.isBound<Server>(Identifiers.HTTP)).toBeTrue();

        const pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);
        const instance = pluginConfiguration.from("core-webhooks", webhooksDefaults);

        serviceProvider.setConfig(instance);

        await expect(serviceProvider.register()).toResolve();
    });

    it("should boot", async () => {
        await expect(coreApiServiceProvider.register()).toResolve();

        expect(app.isBound<Server>(Identifiers.HTTP)).toBeTrue();

        const pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);
        const instance = pluginConfiguration.from("core-webhooks", webhooksDefaults);

        serviceProvider.setConfig(instance);

        await expect(serviceProvider.register()).toResolve();

        await expect(serviceProvider.boot()).toResolve();
    });

    it("should dispose", async () => {
        await expect(coreApiServiceProvider.register()).toResolve();

        expect(app.isBound<Server>(Identifiers.HTTP)).toBeTrue();

        const pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);
        const instance = pluginConfiguration.from("core-webhooks", webhooksDefaults);

        serviceProvider.setConfig(instance);

        await expect(serviceProvider.register()).toResolve();

        await expect(serviceProvider.boot()).toResolve();

        await expect(serviceProvider.dispose()).toResolve();
    });

    it("should bootWhen be true when enabled", async () => {
        await expect(coreApiServiceProvider.register()).toResolve();

        expect(app.isBound<Server>(Identifiers.HTTP)).toBeTrue();

        const pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);

        // @ts-ignore
        webhooksDefaults.enabled = true;
        const instance = pluginConfiguration.from("core-webhooks", webhooksDefaults);

        serviceProvider.setConfig(instance);

        await expect(serviceProvider.bootWhen()).resolves.toBeTrue();
    });

    it("should not be required", async () => {
        await expect(serviceProvider.required()).resolves.toBeFalse();
    });
});
