import "jest-extended";

import { Application, Container, Providers } from "@packages/core-kernel";
import { ServiceProvider } from "@packages/core-watcher/src/service-provider";
import { dirSync, setGracefulCleanup } from "tmp";

let app: Application;

const logger = {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
};

const setPluginConfiguration = (app: Application, serviceProvider: ServiceProvider, configuration: any) => {
    const pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);
    const instance: Providers.PluginConfiguration = pluginConfiguration.from("core-watcher", configuration);

    serviceProvider.setConfig(instance);
};

const mockEventDispatcher = {
    listen: jest.fn(),
};

beforeEach(() => {
    app = new Application(new Container.Container());

    app.bind(Container.Identifiers.LogService).toConstantValue(logger);
    app.bind(Container.Identifiers.PluginConfiguration).to(Providers.PluginConfiguration).inSingletonScope();
    app.bind(Container.Identifiers.EventDispatcherService).toConstantValue(mockEventDispatcher);
    app.bind(Container.Identifiers.FilesystemService).toConstantValue({});
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
        const usedDefaults = { storage: dirSync().name + "/events.sqlite" };
        setPluginConfiguration(app, serviceProvider, usedDefaults);

        await expect(serviceProvider.register()).toResolve();
    });

    it("should boot", async () => {
        const usedDefaults = { storage: dirSync().name + "/events.sqlite" };
        setPluginConfiguration(app, serviceProvider, usedDefaults);

        await expect(serviceProvider.register()).toResolve();
        await expect(serviceProvider.boot()).toResolve();
    });

    it("should dispose", async () => {
        const usedDefaults = { storage: dirSync().name + "/events.sqlite" };
        setPluginConfiguration(app, serviceProvider, usedDefaults);

        await expect(serviceProvider.register()).toResolve();
        await expect(serviceProvider.boot()).toResolve();
        await expect(serviceProvider.dispose()).toResolve();
    });

    it("should not be required", async () => {
        await expect(serviceProvider.required()).resolves.toBeFalse();
    });
});
