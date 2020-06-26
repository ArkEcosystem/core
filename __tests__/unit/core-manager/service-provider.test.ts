import "jest-extended";

import { Application, Container, Providers } from "@packages/core-kernel";
import { defaults } from "@packages/core-manager/src/defaults";
import { Identifiers } from "@packages/core-manager/src/ioc";
import { ServiceProvider } from "@packages/core-manager/src/service-provider";
import { WatcherWallet } from "@packages/core-manager/src/watcher-wallet";
import { cloneDeep } from "lodash";
import path from "path";
import { dirSync, setGracefulCleanup } from "tmp";

let app: Application;

const logger = {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
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
    app.bind(Container.Identifiers.FilesystemService).toConstantValue({});
    app.bind(Container.Identifiers.EventDispatcherService).toConstantValue(mockEventDispatcher);
    app.bind(Container.Identifiers.WalletAttributes).toConstantValue({});

    defaults.watcher.storage = dirSync().name + "/events.sqlite";
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

    it("should boot and dispose HTTPS server", async () => {
        const usedDefaults = { ...defaults };

        usedDefaults.server.http.enabled = false;
        usedDefaults.server.https.enabled = "enabled";

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
        usedDefaults.server.https.enabled = "enabled";

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
        usedDefaults.watcher.watch.logs = false;
        usedDefaults.watcher.watch.wallets = false;

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

    it("should create wallet", async () => {
        const usedDefaults = cloneDeep(defaults);

        usedDefaults.watcher.enabled = true;
        usedDefaults.watcher.watch.wallets = true;

        setPluginConfiguration(app, serviceProvider, usedDefaults);

        await expect(serviceProvider.register()).toResolve();

        // @ts-ignore
        const wallet = app.get(Container.Identifiers.WalletFactory)("123");
        expect(wallet).toBeInstanceOf(WatcherWallet);

        await expect(serviceProvider.dispose()).toResolve();
    });
});
