import "jest-extended";
import { resolve } from "path";

import { Application } from "@packages/core-kernel/src/application";
import { Container, interfaces, Identifiers } from "@packages/core-kernel/src/container";
import { ServiceProvider } from "@packages/core-kernel/src/providers/service-provider";
import { PackageManifest } from "@packages/core-kernel/src/providers/package-manifest";
import { PackageConfiguration } from "@packages/core-kernel/src/providers/package-configuration";
import { ConfigRepository } from "@packages/core-kernel/src/services/config/repository";

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

        const packageManifest: PackageManifest = new PackageManifest().discover(
            resolve(__dirname, "../__stubs__/stub-package"),
        );
        serviceProvider.setManifest(packageManifest);

        expect(serviceProvider.manifest()).toEqual(packageManifest);
    });

    it(".name", () => {
        const serviceProvider: ServiceProvider = app.resolve(StubServiceProvider);

        serviceProvider.setManifest(new PackageManifest().discover(resolve(__dirname, "../__stubs__/stub-package")));

        expect(serviceProvider.name()).toBe("stub-package");
    });

    it(".name (no manifest)", () => {
        expect(app.resolve(StubServiceProvider).name()).toBeUndefined();
    });

    it(".version", () => {
        const serviceProvider: ServiceProvider = app.resolve(StubServiceProvider);

        serviceProvider.setManifest(new PackageManifest().discover(resolve(__dirname, "../__stubs__/stub-package")));

        expect(serviceProvider.version()).toBe("1.0.0");
    });

    it(".version (no manifest)", () => {
        expect(app.resolve(StubServiceProvider).version()).toBeUndefined();
    });

    it(".config", () => {
        app.bind(Identifiers.ConfigRepository).toConstantValue(new ConfigRepository({}));

        const serviceProvider: ServiceProvider = app.resolve(StubServiceProvider);

        const packageConfiguration: PackageConfiguration = app
            .resolve(PackageConfiguration)
            .discover(resolve(__dirname, "../__stubs__/stub-package"));
        serviceProvider.setConfig(packageConfiguration);

        expect(serviceProvider.config()).toEqual(packageConfiguration);
    });

    it(".configDefaults", () => {
        expect(app.resolve(StubServiceProvider).configDefaults()).toEqual({});
    });

    it(".configSchema", () => {
        expect(app.resolve(StubServiceProvider).configSchema()).toEqual({});
    });

    it(".dependencies", () => {
        expect(app.resolve(StubServiceProvider).dependencies()).toEqual([]);
    });

    it(".enableWhen", async () => {
        await expect(app.resolve(StubServiceProvider).enableWhen()).resolves.toBeTrue();
    });

    it(".disableWhen", async () => {
        await expect(app.resolve(StubServiceProvider).disableWhen()).resolves.toBeFalse();
    });

    it(".required", async () => {
        await expect(app.resolve(StubServiceProvider).required()).resolves.toBeFalse();
    });
});
