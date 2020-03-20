import "jest-extended";

import path from "path";
import { Identifiers, Server, ServiceProvider as CoreApiServiceProvider } from "@packages/core-api/src";
import { Application, Container, Providers } from "@packages/core-kernel";
import { defaults } from "@packages/core-api/src/defaults";

let app: Application;

const logger = {
    notice: jest.fn(),
    debug: jest.fn(),
    warning: jest.fn(),
};

beforeEach(() => {
    app = new Application(new Container.Container());

    app.bind(Container.Identifiers.LogService).toConstantValue(logger);

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
        .toConstantValue({});

    defaults.server.https.enabled = "enabled";
    defaults.server.https.tls.key = path.resolve(__dirname, "./__fixtures__/key.pem");
    defaults.server.https.tls.cert = path.resolve(__dirname, "./__fixtures__/server.crt");
});

describe("ServiceProvider", () => {

    it("should register", async () => {
        let coreApiServiceProvider = app.resolve<CoreApiServiceProvider>(CoreApiServiceProvider);

        let pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);
        const instance: Providers.PluginConfiguration = pluginConfiguration.from("core-api", defaults);

        coreApiServiceProvider.setConfig(instance);

        await expect(coreApiServiceProvider.register()).toResolve();

        expect(app.isBound<Server>(Identifiers.HTTP)).toBeTrue();
    });

    it("should boot", async () => {
        let coreApiServiceProvider = app.resolve<CoreApiServiceProvider>(CoreApiServiceProvider);

        let pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);
        const instance: Providers.PluginConfiguration = pluginConfiguration.from("core-api", defaults);

        coreApiServiceProvider.setConfig(instance);

        await expect(coreApiServiceProvider.register()).toResolve();

        expect(app.isBound<Server>(Identifiers.HTTP)).toBeTrue();

        await expect(coreApiServiceProvider.boot()).toResolve();
    });

    it("should dispose", async () => {
        let coreApiServiceProvider = app.resolve<CoreApiServiceProvider>(CoreApiServiceProvider);

        let pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);
        const instance: Providers.PluginConfiguration = pluginConfiguration.from("core-api", defaults);

        coreApiServiceProvider.setConfig(instance);

        await expect(coreApiServiceProvider.register()).toResolve();

        expect(app.isBound<Server>(Identifiers.HTTP)).toBeTrue();

        await expect(coreApiServiceProvider.boot()).toResolve();

        await expect(coreApiServiceProvider.dispose()).toResolve();
    });

    it("should not be required", async () => {
        let coreApiServiceProvider = app.resolve<CoreApiServiceProvider>(CoreApiServiceProvider);

        await expect(coreApiServiceProvider.required()).resolves.toBeFalse();
    })
});
