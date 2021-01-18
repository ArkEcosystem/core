import "jest-extended";
import { AnySchema } from "@hapi/joi";

import { Identifiers, Server, ServiceProvider as CoreApiServiceProvider } from "@packages/core-api/src";
import { defaults } from "@packages/core-api/src/defaults";
import { Application, Container, Providers } from "@packages/core-kernel";
import path from "path";

let app: Application;

const logger = {
    notice: jest.fn(),
    debug: jest.fn(),
    warning: jest.fn(),
};

beforeEach(() => {
    app = new Application(new Container.Container());

    app.bind(Container.Identifiers.LogService).toConstantValue(logger);

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

    app.bind(Container.Identifiers.EventDispatcherService).toConstantValue({});

    app.bind(Container.Identifiers.BlockHistoryService).toConstantValue({});

    app.bind(Container.Identifiers.TransactionHistoryService).toConstantValue({});

    app.bind(Container.Identifiers.TransactionHandlerRegistry).toConstantValue({});

    app.bind(Container.Identifiers.StandardCriteriaService).toConstantValue({});

    app.bind(Container.Identifiers.PaginationService).toConstantValue({});

    defaults.server.http.enabled = true;
    defaults.server.https.enabled = "enabled";
    defaults.server.https.tls.key = path.resolve(__dirname, "./__fixtures__/key.pem");
    defaults.server.https.tls.cert = path.resolve(__dirname, "./__fixtures__/server.crt");
});

describe("ServiceProvider", () => {
    it("should register", async () => {
        const coreApiServiceProvider = app.resolve<CoreApiServiceProvider>(CoreApiServiceProvider);

        const pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);
        const instance: Providers.PluginConfiguration = pluginConfiguration.from("core-api", defaults);

        coreApiServiceProvider.setConfig(instance);

        await expect(coreApiServiceProvider.register()).toResolve();

        expect(app.isBound<Server>(Identifiers.HTTP)).toBeTrue();
    });

    it("should boot", async () => {
        const coreApiServiceProvider = app.resolve<CoreApiServiceProvider>(CoreApiServiceProvider);

        const pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);
        const instance: Providers.PluginConfiguration = pluginConfiguration.from("core-api", defaults);

        coreApiServiceProvider.setConfig(instance);

        await expect(coreApiServiceProvider.register()).toResolve();

        expect(app.isBound<Server>(Identifiers.HTTP)).toBeTrue();
        expect(app.isBound<Server>(Identifiers.HTTPS)).toBeTrue();

        await expect(coreApiServiceProvider.boot()).toResolve();
    });

    it("should boot if HTTP and HTTPS server are disabled", async () => {
        defaults.server.http.enabled = false;
        defaults.server.https.enabled = undefined;

        const coreApiServiceProvider = app.resolve<CoreApiServiceProvider>(CoreApiServiceProvider);

        const pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);
        const instance: Providers.PluginConfiguration = pluginConfiguration.from("core-api", defaults);

        coreApiServiceProvider.setConfig(instance);

        await expect(coreApiServiceProvider.register()).toResolve();

        expect(app.isBound<Server>(Identifiers.HTTP)).toBeFalse();
        expect(app.isBound<Server>(Identifiers.HTTPS)).toBeFalse();

        await expect(coreApiServiceProvider.boot()).toResolve();
    });

    it("should dispose", async () => {
        const coreApiServiceProvider = app.resolve<CoreApiServiceProvider>(CoreApiServiceProvider);

        const pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);
        const instance: Providers.PluginConfiguration = pluginConfiguration.from("core-api", defaults);

        coreApiServiceProvider.setConfig(instance);

        await expect(coreApiServiceProvider.register()).toResolve();

        expect(app.isBound<Server>(Identifiers.HTTP)).toBeTrue();
        expect(app.isBound<Server>(Identifiers.HTTPS)).toBeTrue();

        await expect(coreApiServiceProvider.boot()).toResolve();

        await expect(coreApiServiceProvider.dispose()).toResolve();
    });

    it("should dispose if HTTP and HTTPS server are disabled", async () => {
        defaults.server.http.enabled = false;
        defaults.server.https.enabled = undefined;

        const coreApiServiceProvider = app.resolve<CoreApiServiceProvider>(CoreApiServiceProvider);

        const pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);
        const instance: Providers.PluginConfiguration = pluginConfiguration.from("core-api", defaults);

        coreApiServiceProvider.setConfig(instance);

        await expect(coreApiServiceProvider.register()).toResolve();

        expect(app.isBound<Server>(Identifiers.HTTP)).toBeFalse();
        expect(app.isBound<Server>(Identifiers.HTTPS)).toBeFalse();

        await expect(coreApiServiceProvider.boot()).toResolve();

        await expect(coreApiServiceProvider.dispose()).toResolve();
    });

    it("should not be required", async () => {
        const coreApiServiceProvider = app.resolve<CoreApiServiceProvider>(CoreApiServiceProvider);

        await expect(coreApiServiceProvider.required()).resolves.toBeFalse();
    });

    describe("configSchema", () => {
        let coreApiServiceProvider: CoreApiServiceProvider;

        beforeEach(() => {
            coreApiServiceProvider = app.resolve<CoreApiServiceProvider>(CoreApiServiceProvider);
        });

        it("should validate schema", async () => {
            jest.resetModules();
            const result = (coreApiServiceProvider.configSchema() as AnySchema).validate(
                (await import("@packages/core-api/src/defaults")).defaults,
            );

            expect(result.error).toBeUndefined();

            expect(result.value.server.http.enabled).toBeTrue();
            expect(result.value.server.http.host).toEqual("0.0.0.0");
            expect(result.value.server.http.port).toEqual(4003);

            expect(result.value.server.https.enabled).toBeFalse();
            expect(result.value.server.https.host).toEqual("0.0.0.0");
            expect(result.value.server.https.port).toEqual(8443);
            expect(result.value.server.https.tls.key).toBeUndefined();
            expect(result.value.server.https.tls.cert).toBeUndefined();

            expect(result.value.plugins.cache.enabled).toBeTrue();
            expect(result.value.plugins.cache.stdTTL).toBeNumber();
            expect(result.value.plugins.cache.checkperiod).toBeNumber();

            expect(result.value.plugins.rateLimit.enabled).toBeTrue();
            expect(result.value.plugins.rateLimit.points).toBeNumber();
            expect(result.value.plugins.rateLimit.duration).toBeNumber();
            expect(result.value.plugins.rateLimit.whitelist).toEqual([]);
            expect(result.value.plugins.rateLimit.blacklist).toEqual([]);

            expect(result.value.plugins.pagination.limit).toBeNumber();
            expect(result.value.plugins.socketTimeout).toBeNumber();
            expect(result.value.plugins.whitelist).toEqual(["*"]);
            expect(result.value.plugins.trustProxy).toBeFalse();

            expect(result.value.options.estimateTotalCount).toBeTrue();
        });
    });
});
