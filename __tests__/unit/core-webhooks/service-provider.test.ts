import "jest-extended";

import { Identifiers, Server, ServiceProvider as CoreApiServiceProvider } from "@packages/core-api/src";
import { ServiceProvider } from "@packages/core-webhooks/src";
import { Application, Container, Providers } from "@packages/core-kernel";
import { NullEventDispatcher } from "@arkecosystem/core-kernel/src/services/events/drivers/null";
import { defaults } from "@packages/core-api/src/defaults";
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

    app
        .bind(Container.Identifiers.PluginConfiguration)
        .to(Providers.PluginConfiguration)
        .inSingletonScope();

    app
        .bind(Container.Identifiers.StateStore)
        .toConstantValue({});

    app
        .bind(Container.Identifiers.BlockchainService)
        .toConstantValue({});

    app
        .bind(Container.Identifiers.BlockRepository)
        .toConstantValue({});

    app
        .bind(Container.Identifiers.TransactionRepository)
        .toConstantValue({});

    app
        .bind(Container.Identifiers.WalletRepository)
        .toConstantValue({});

    app
        .bind(Container.Identifiers.PeerNetworkMonitor)
        .toConstantValue({});

    app
        .bind(Container.Identifiers.PeerStorage)
        .toConstantValue({});

    app
        .bind(Container.Identifiers.RoundRepository)
        .toConstantValue({});

    app
        .bind(Container.Identifiers.TransactionPoolQuery)
        .toConstantValue({});

    app
        .bind(Container.Identifiers.TransactionPoolProcessorFactory)
        .toConstantValue({});

    app
        .bind(Container.Identifiers.EventDispatcherService)
        .to(NullEventDispatcher);

    app
        .bind(Container.Identifiers.LogService)
        .toConstantValue(logger);

    app.bind("path.cache").toConstantValue(dirSync().name);
});

afterAll(() => setGracefulCleanup());

describe("ServiceProvider", () => {
    let serviceProvider: ServiceProvider;
    let coreApiServiceProvider: CoreApiServiceProvider

    beforeEach(async () => {
        coreApiServiceProvider = app.resolve<CoreApiServiceProvider>(CoreApiServiceProvider);

        let pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);
        let instance: Providers.PluginConfiguration = pluginConfiguration.from("core-api", defaults);

        coreApiServiceProvider.setConfig(instance);

        serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);
    });

    it("should register", async () => {
        await expect(coreApiServiceProvider.register()).toResolve();

        expect(app.isBound<Server>(Identifiers.HTTP)).toBeTrue();

        let pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);
        let instance = pluginConfiguration.from("core-webhooks", webhooksDefaults);

        serviceProvider.setConfig(instance);

        await expect(serviceProvider.register()).toResolve();
    });

    it("should boot", async () => {
        await expect(coreApiServiceProvider.register()).toResolve();

        expect(app.isBound<Server>(Identifiers.HTTP)).toBeTrue();

        let pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);
        let instance = pluginConfiguration.from("core-webhooks", webhooksDefaults);

        serviceProvider.setConfig(instance);

        await expect(serviceProvider.register()).toResolve();

        await expect(serviceProvider.boot()).toResolve();
    });

    it("should dispose", async () => {
        await expect(coreApiServiceProvider.register()).toResolve();

        expect(app.isBound<Server>(Identifiers.HTTP)).toBeTrue();

        let pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);
        let instance = pluginConfiguration.from("core-webhooks", webhooksDefaults);

        serviceProvider.setConfig(instance);

        await expect(serviceProvider.register()).toResolve();

        await expect(serviceProvider.boot()).toResolve();

        await expect(serviceProvider.dispose()).toResolve();
    });

    it("should bootWhen be true when enabled", async () => {
        await expect(coreApiServiceProvider.register()).toResolve();

        expect(app.isBound<Server>(Identifiers.HTTP)).toBeTrue();

        let pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);

        // @ts-ignore
        webhooksDefaults.enabled = true;
        let instance = pluginConfiguration.from("core-webhooks", webhooksDefaults);

        serviceProvider.setConfig(instance);

        await expect(serviceProvider.bootWhen()).resolves.toBeTrue();
    });

    it("should not be required", async () => {
        await expect(serviceProvider.required()).resolves.toBeFalse();
    })
});
