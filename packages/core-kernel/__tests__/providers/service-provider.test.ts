import "jest-extended";

import { Application } from "@packages/core-kernel/src/application";
import { Container, interfaces } from "@packages/core-kernel/src/ioc";
import { PluginConfiguration } from "@packages/core-kernel/src/providers/plugin-configuration";
import { PluginManifest } from "@packages/core-kernel/src/providers/plugin-manifest";
import { ServiceProvider } from "@packages/core-kernel/src/providers/service-provider";
import { resolve } from "path";

let app: Application;
let container: interfaces.Container;

beforeEach(() => {
    container = new Container();
    container.snapshot();

    app = new Application(container);
});

afterEach(() => container.restore());

class StubServiceProvider extends ServiceProvider {
    async register() {}
}

describe("ServiceProvider", () => {
    it(".register", async () => {
        const serviceProvider: ServiceProvider = app.resolve(StubServiceProvider);

        const spy: jest.SpyInstance = jest.spyOn(serviceProvider, "register");

        await serviceProvider.register();

        expect(spy).toHaveBeenCalled();
    });

    it(".boot", async () => {
        const serviceProvider: ServiceProvider = app.resolve(StubServiceProvider);

        const spy: jest.SpyInstance = jest.spyOn(serviceProvider, "boot");

        await serviceProvider.boot();

        expect(spy).toHaveBeenCalled();
    });

    it(".dispose", async () => {
        const serviceProvider: ServiceProvider = app.resolve(StubServiceProvider);

        const spy: jest.SpyInstance = jest.spyOn(serviceProvider, "dispose");

        await serviceProvider.dispose();

        expect(spy).toHaveBeenCalled();
    });

    it(".manifest", () => {
        const serviceProvider: ServiceProvider = app.resolve(StubServiceProvider);

        const pluginManifest: PluginManifest = new PluginManifest().discover(
            resolve(__dirname, "../__stubs__/stub-plugin"),
        );
        serviceProvider.setManifest(pluginManifest);

        expect(serviceProvider.manifest()).toEqual(pluginManifest);
    });

    it(".name", () => {
        const serviceProvider: ServiceProvider = app.resolve(StubServiceProvider);

        serviceProvider.setManifest(new PluginManifest().discover(resolve(__dirname, "../__stubs__/stub-plugin")));

        expect(serviceProvider.name()).toBe("stub-plugin");
    });

    it(".name (no manifest)", () => {
        expect(app.resolve(StubServiceProvider).name()).toBeUndefined();
    });

    it(".version", () => {
        const serviceProvider: ServiceProvider = app.resolve(StubServiceProvider);

        serviceProvider.setManifest(new PluginManifest().discover(resolve(__dirname, "../__stubs__/stub-plugin")));

        expect(serviceProvider.version()).toBe("1.0.0");
    });

    it(".version (no manifest)", () => {
        expect(app.resolve(StubServiceProvider).version()).toBeUndefined();
    });

    it(".alias", () => {
        const serviceProvider: ServiceProvider = app.resolve(StubServiceProvider);

        serviceProvider.setManifest(new PluginManifest().discover(resolve(__dirname, "../__stubs__/stub-plugin")));

        expect(serviceProvider.alias()).toBe("some-alias");
    });

    it(".alias (no manifest)", () => {
        expect(app.resolve(StubServiceProvider).alias()).toBeUndefined();
    });

    it(".config", () => {
        const serviceProvider: ServiceProvider = app.resolve(StubServiceProvider);

        const pluginConfiguration: PluginConfiguration = app
            .resolve(PluginConfiguration)
            .discover("stub-plugin", resolve(__dirname, "../__stubs__/stub-plugin"));
        serviceProvider.setConfig(pluginConfiguration);

        expect(serviceProvider.config()).toEqual(pluginConfiguration);
    });

    it(".configDefaults", () => {
        expect(app.resolve(StubServiceProvider).configDefaults()).toEqual({});
    });

    it(".configSchema", () => {
        expect(app.resolve(StubServiceProvider).configSchema()).toEqual({});
    });

    it(".dependencies", () => {
        const serviceProvider: ServiceProvider = app.resolve(StubServiceProvider);

        serviceProvider.setManifest(new PluginManifest().discover(resolve(__dirname, "../__stubs__/stub-plugin")));

        expect(serviceProvider.dependencies()).toEqual([{ name: "some-dependency" }]);
    });

    it(".dependencies (no manifest)", () => {
        expect(app.resolve(StubServiceProvider).dependencies()).toEqual([]);
    });

    it(".bootWhen", async () => {
        await expect(app.resolve(StubServiceProvider).bootWhen()).resolves.toBeTrue();
    });

    it(".disposeWhen", async () => {
        await expect(app.resolve(StubServiceProvider).disposeWhen()).resolves.toBeFalse();
    });

    it(".required", () => {
        const serviceProvider: ServiceProvider = app.resolve(StubServiceProvider);

        serviceProvider.setManifest(new PluginManifest().discover(resolve(__dirname, "../__stubs__/stub-plugin")));

        expect(serviceProvider.required()).resolves.toBeTrue();
    });

    it(".required (no manifest)", () => {
        expect(app.resolve(StubServiceProvider).required()).resolves.toBeFalse();
    });
});
