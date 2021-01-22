import "jest-extended";

import { Application, Container, Providers } from "@packages/core-kernel";
import { defaults } from "@packages/core-manager/src/defaults";
import { Identifiers } from "@packages/core-manager/src/ioc";
import { ServiceProvider } from "@packages/core-manager/src/service-provider";
import { cloneDeep } from "lodash";
import path from "path";
import { dirSync, setGracefulCleanup } from "tmp";
import { AnySchema } from "@hapi/joi";

let app: Application;

const logger = {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    notice: jest.fn(),
};

const mockEventDispatcher = {
    listen: jest.fn(),
};

const setPluginConfiguration = (app: Application, serviceProvider: ServiceProvider, configuration: any) => {
    const pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);
    const instance: Providers.PluginConfiguration = pluginConfiguration.from("core-manager", configuration);

    serviceProvider.setConfig(instance);
};

beforeEach(() => {
    app = new Application(new Container.Container());

    app.bind(Container.Identifiers.LogService).toConstantValue(logger);
    app.bind(Container.Identifiers.PluginConfiguration).to(Providers.PluginConfiguration).inSingletonScope();
    app.bind(Container.Identifiers.ConfigFlags).toConstantValue({ processType: "manager" });
    app.bind(Container.Identifiers.FilesystemService).toConstantValue({});
    app.bind(Container.Identifiers.EventDispatcherService).toConstantValue(mockEventDispatcher);
    app.bind(Container.Identifiers.WalletAttributes).toConstantValue({});

    defaults.watcher.storage = dirSync().name + "/events.sqlite";
    defaults.logs.storage = dirSync().name + "/logs.sqlite";
    defaults.server.https.tls.key = path.resolve(__dirname, "./__fixtures__/key.pem");
    defaults.server.https.tls.cert = path.resolve(__dirname, "./__fixtures__/server.crt");
});

afterEach(() => {
    setGracefulCleanup();
});

describe("ServiceProvider", () => {
    let serviceProvider: ServiceProvider;

    beforeEach(() => {
        serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);
    });

    it("should contain required core-snapshot dependency when processType is equal manager", async () => {
        await expect(serviceProvider.dependencies()).toEqual([
            { name: "@arkecosystem/core-snapshots", required: true },
        ]);
    });

    it("should not contain dependencies when processType is not equal manager", async () => {
        app.rebind(Container.Identifiers.ConfigFlags).toConstantValue({ processType: "core" });

        await expect(serviceProvider.dependencies()).toEqual([]);
    });

    it("should register", async () => {
        const usedDefaults = cloneDeep(defaults);

        setPluginConfiguration(app, serviceProvider, usedDefaults);

        await expect(serviceProvider.register()).toResolve();
    });

    it("should boot and dispose HTTP server", async () => {
        const usedDefaults = { ...defaults };

        usedDefaults.server.http.enabled = true;

        setPluginConfiguration(app, serviceProvider, usedDefaults);

        await expect(serviceProvider.register()).toResolve();

        await expect(serviceProvider.boot()).toResolve();

        expect(app.isBound(Identifiers.HTTP)).toBeTrue();
        expect(app.isBound(Identifiers.HTTPS)).not.toBeTrue();

        await expect(serviceProvider.dispose()).toResolve();
    });

    it("should not boot HTTP server and register actions when process is not manager", async () => {
        app.rebind(Container.Identifiers.ConfigFlags).toConstantValue({ processType: "core" });

        const usedDefaults = { ...defaults };

        usedDefaults.server.http.enabled = true;

        setPluginConfiguration(app, serviceProvider, usedDefaults);

        await expect(serviceProvider.register()).toResolve();

        await expect(serviceProvider.boot()).toResolve();

        expect(app.isBound(Identifiers.HTTP)).toBeFalse();
        expect(app.isBound(Identifiers.HTTPS)).toBeFalse();
        expect(app.isBound(Identifiers.ActionReader)).toBeFalse();

        await expect(serviceProvider.dispose()).toResolve();
    });

    it("should boot and dispose HTTPS server", async () => {
        const usedDefaults = { ...defaults };

        usedDefaults.server.http.enabled = false;
        usedDefaults.server.https.enabled = true;

        setPluginConfiguration(app, serviceProvider, usedDefaults);

        await expect(serviceProvider.register()).toResolve();

        await expect(serviceProvider.boot()).toResolve();

        expect(app.isBound(Identifiers.HTTP)).not.toBeTrue();
        expect(app.isBound(Identifiers.HTTPS)).toBeTrue();

        await expect(serviceProvider.dispose()).toResolve();
    });

    it("should dispose with HTTP and HTTPS server", async () => {
        const usedDefaults = { ...defaults };

        usedDefaults.server.http.enabled = true;
        usedDefaults.server.https.enabled = true;

        setPluginConfiguration(app, serviceProvider, usedDefaults);

        await expect(serviceProvider.register()).toResolve();

        await expect(serviceProvider.boot()).toResolve();

        expect(app.isBound(Identifiers.HTTP)).toBeTrue();
        expect(app.isBound(Identifiers.HTTPS)).toBeTrue();

        await expect(serviceProvider.dispose()).toResolve();
    });

    it("should boot event listener", async () => {
        const usedDefaults = { ...defaults };

        usedDefaults.watcher.enabled = true;

        setPluginConfiguration(app, serviceProvider, usedDefaults);

        await expect(serviceProvider.register()).toResolve();

        const mockEventListener = {
            boot: jest.fn(),
        };

        app.unbind(Identifiers.EventsListener);

        app.bind(Identifiers.EventsListener).toConstantValue(mockEventListener);

        await expect(serviceProvider.boot()).toResolve();

        expect(app.isBound(Identifiers.EventsListener)).toBeTrue();
        expect(mockEventListener.boot).toHaveBeenCalledTimes(1);

        await expect(serviceProvider.dispose()).toResolve();
    });

    it("should boot with disabled individual watchers", async () => {
        const usedDefaults = { ...defaults };

        usedDefaults.watcher.enabled = true;

        usedDefaults.watcher.watch.queries = false;
        usedDefaults.watcher.watch.wallets = false;
        usedDefaults.logs.enabled = false;

        setPluginConfiguration(app, serviceProvider, usedDefaults);

        await expect(serviceProvider.register()).toResolve();

        const mockEventListener = {
            boot: jest.fn(),
        };

        app.unbind(Identifiers.EventsListener);

        app.bind(Identifiers.EventsListener).toConstantValue(mockEventListener);

        await expect(serviceProvider.boot()).toResolve();

        expect(app.isBound(Identifiers.EventsListener)).toBeTrue();
        expect(mockEventListener.boot).toHaveBeenCalledTimes(1);

        await expect(serviceProvider.dispose()).toResolve();
    });

    it("should not be required", async () => {
        await expect(serviceProvider.required()).resolves.toBeFalse();
    });

    describe("configSchema", () => {
        beforeEach(() => {
            serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);

            for (const key of Object.keys(process.env)) {
                if (
                    key.includes("CORE_WATCHER_") ||
                    key.includes("CORE_WATCH_") ||
                    key.includes("CORE_MONITOR") ||
                    key === "CORE_RESET_DATABASE"
                ) {
                    delete process.env[key];
                }
            }
        });

        it("should validate schema using defaults", async () => {
            jest.resetModules();
            const result = (serviceProvider.configSchema() as AnySchema).validate(
                (await import("@packages/core-manager/src/defaults")).defaults,
            );

            expect(result.error).toBeUndefined();

            // Watcher
            expect(result.value.watcher.enabled).toBeFalse();
            expect(result.value.watcher.resetDatabase).toBeFalse();
            expect(result.value.watcher.storage).toBeString();
            expect(result.value.watcher.watch.blocks).toBeTrue();
            expect(result.value.watcher.watch.errors).toBeTrue();
            expect(result.value.watcher.watch.queries).toBeTrue();
            expect(result.value.watcher.watch.queues).toBeTrue();
            expect(result.value.watcher.watch.rounds).toBeTrue();
            expect(result.value.watcher.watch.schedules).toBeTrue();
            expect(result.value.watcher.watch.transactions).toBeTrue();
            expect(result.value.watcher.watch.wallets).toBeTrue();
            expect(result.value.watcher.watch.webhooks).toBeTrue();

            // Logs
            expect(result.value.logs.enabled).toBeTrue();
            expect(result.value.logs.resetDatabase).toBeFalse();
            expect(result.value.logs.storage).toBeString();
            expect(result.value.logs.history).toBeNumber();

            // HTTP
            expect(result.value.server.http.enabled).toBeTrue();
            expect(result.value.server.http.host).toEqual("0.0.0.0");
            expect(result.value.server.http.port).toEqual(4005);

            // HTTPS
            expect(result.value.server.https.enabled).toBeFalse();
            expect(result.value.server.https.host).toEqual("0.0.0.0");
            expect(result.value.server.https.port).toEqual(8445);
            expect(result.value.server.https.tls.key).toBeUndefined();
            expect(result.value.server.https.tls.cert).toBeUndefined();

            // Plugins
            expect(result.value.plugins.whitelist).toEqual(["127.0.0.1", "::ffff:127.0.0.1"]);

            expect(result.value.plugins.tokenAuthentication.enabled).toBeFalse();

            expect(result.value.plugins.basicAuthentication.enabled).toBeFalse();
            expect(result.value.plugins.basicAuthentication.users).toEqual([]);
        });


    });
});
