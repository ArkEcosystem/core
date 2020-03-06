import "jest-extended";

import { Identifiers, Server, ServiceProvider as CoreApiServiceProvider } from "@packages/core-api/src";
import { ServiceProvider } from "@packages/core-magistrate-api/src";
import { Application, Container, Providers } from "@packages/core-kernel";
import { defaults } from "@packages/core-api/src/defaults";

let app: Application;

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
});

describe("ServiceProvider", () => {
    let serviceProvider: ServiceProvider;

    it("should register", async () => {
        let coreApiServiceProvider = app.resolve<CoreApiServiceProvider>(CoreApiServiceProvider);

        let pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);
        const instance: Providers.PluginConfiguration = pluginConfiguration.from("core-api", defaults);

        coreApiServiceProvider.setConfig(instance);

        await expect(coreApiServiceProvider.register()).toResolve();

        expect(app.isBound<Server>(Identifiers.HTTP)).toBeTrue();

        serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);

        await expect(serviceProvider.register()).toResolve();
    });

    it("should not be required", async () => {
        await expect(serviceProvider.required()).resolves.toBeFalse();
    })
});
