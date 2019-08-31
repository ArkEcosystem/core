import "jest-extended";
import { resolve } from "path";
import { Application } from "@packages/core-kernel/src/application";
import { Container, interfaces, Identifiers } from "@packages/core-kernel/src/container";
import { PackageConfiguration } from "@packages/core-kernel/src/providers/package-configuration";
import { ConfigRepository } from "@packages/core-kernel/src/services/config";

let app: Application;
let container: interfaces.Container;
let packageConfiguration: PackageConfiguration;

beforeEach(() => {
    container = new Container();
    container.snapshot();

    app = new Application(container);
    app.bind(Identifiers.ConfigRepository).toConstantValue(new ConfigRepository({}));

    packageConfiguration = app.resolve<PackageConfiguration>(PackageConfiguration);
});

afterEach(() => container.restore());

describe("PackageConfiguration", () => {
    it("should create an instance from a name and defaults", () => {
        app.get<ConfigRepository>(Identifiers.ConfigRepository).set("options", {
            dummy: { key: "value" },
        });

        const instance: PackageConfiguration = packageConfiguration.from("dummy", { some: "value" });

        expect(instance.all()).toEqual({ some: "value", key: "value" });
    });

    it("should discover the defaults for the given package", () => {
        packageConfiguration.discover(resolve(__dirname, "../__stubs__/stub-package-with-defaults"));

        expect(packageConfiguration.all()).toEqual({ defaultKey: "defaultValue" });
    });

    it("should merge the given value", () => {
        packageConfiguration.set("key", "value");
        packageConfiguration.merge({ some: "value" });

        expect(packageConfiguration.all()).toEqual({ some: "value", key: "value" });
    });

    it("should set and get the given value", () => {
        packageConfiguration.set("key", "value");

        expect(packageConfiguration.all()).toEqual({ key: "value" });
        expect(packageConfiguration.get("key")).toBe("value");
        expect(packageConfiguration.has("key")).toBeTrue();

        packageConfiguration.unset("key");

        expect(packageConfiguration.all()).toEqual({});
        expect(packageConfiguration.get("key")).toBeUndefined();
        expect(packageConfiguration.has("key")).toBeFalse();
    });
});
