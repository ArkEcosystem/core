import "jest-extended";

import { Application, Container, Providers } from "@packages/core-kernel";
import { defaults } from "@packages/core-manager/src/defaults";
import { Identifiers } from "@packages/core-manager/src/ioc";
import { ServiceProvider } from "@packages/core-manager/src/service-provider";
import path from "path";

let app: Application;

const logger = {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
};

const setPluginConfiguration = (app: Application, serviceProvider: ServiceProvider, configuration: any) => {
    const pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);
    const instance: Providers.PluginConfiguration = pluginConfiguration.from("core-monitor", configuration);

    serviceProvider.setConfig(instance);
};

beforeEach(() => {
    app = new Application(new Container.Container());

    app.bind(Container.Identifiers.LogService).toConstantValue(logger);
    app.bind(Container.Identifiers.PluginConfiguration).to(Providers.PluginConfiguration).inSingletonScope();
    app.bind(Container.Identifiers.FilesystemService).toConstantValue({});

    defaults.server.https.tls.key = path.resolve(__dirname, "./__fixtures__/key.pem");
    defaults.server.https.tls.cert = path.resolve(__dirname, "./__fixtures__/server.crt");
});

describe("ServiceProvider", () => {
    let serviceProvider: ServiceProvider;

    beforeEach(() => {
        serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);
    });

    it("should register", async () => {
        const usedDefaults = { ...defaults };

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

    it("should not be required", async () => {
        await expect(serviceProvider.required()).resolves.toBeFalse();
    });
});
