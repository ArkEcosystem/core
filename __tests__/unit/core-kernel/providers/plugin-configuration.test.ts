import "jest-extended";
import { resolve } from "path";
import { Application } from "@packages/core-kernel/src/application";
import { Container, interfaces, Identifiers } from "@packages/core-kernel/src/ioc";
import { PluginConfiguration } from "@packages/core-kernel/src/providers/plugin-configuration";
import { ConfigRepository } from "@packages/core-kernel/src/services/config";

let app: Application;
let container: interfaces.Container;
let pluginConfiguration: PluginConfiguration;

beforeEach(() => {
    container = new Container();
    container.snapshot();

    app = new Application(container);
    app.bind(Identifiers.ConfigRepository)
        .to(ConfigRepository)
        .inSingletonScope();

    pluginConfiguration = app.resolve<PluginConfiguration>(PluginConfiguration);
});

afterEach(() => container.restore());

describe("PluginConfiguration", () => {
    it("should create an instance from a name and defaults", () => {
        app.get<ConfigRepository>(Identifiers.ConfigRepository).set("app.pluginOptions", {
            dummy: { key: "value" },
        });

        const instance: PluginConfiguration = pluginConfiguration.from("dummy", { some: "value" });

        expect(instance.all()).toEqual({ some: "value", key: "value" });
    });

    it("should discover the defaults for the given plugin", () => {
        pluginConfiguration.discover(resolve(__dirname, "../__stubs__/stub-plugin-with-defaults"));

        expect(pluginConfiguration.all()).toEqual({ defaultKey: "defaultValue" });
    });

    it("should merge the given value", () => {
        pluginConfiguration.set("key", "value");
        pluginConfiguration.merge({ some: "value" });

        expect(pluginConfiguration.all()).toEqual({ some: "value", key: "value" });
    });

    it("should set and get the given value", () => {
        pluginConfiguration.set("key", "value");

        expect(pluginConfiguration.all()).toEqual({ key: "value" });
        expect(pluginConfiguration.get("key")).toBe("value");
        expect(pluginConfiguration.has("key")).toBeTrue();

        pluginConfiguration.unset("key");

        expect(pluginConfiguration.all()).toEqual({});
        expect(pluginConfiguration.get("key")).toBeUndefined();
        expect(pluginConfiguration.has("key")).toBeFalse();
    });
});
