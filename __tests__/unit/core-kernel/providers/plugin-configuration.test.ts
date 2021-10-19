import "jest-extended";

import { Application } from "@packages/core-kernel/src/application";
import { Container, Identifiers } from "@packages/core-kernel/src/ioc";
import { PluginConfiguration } from "@packages/core-kernel/src/providers/plugin-configuration";
import { ConfigRepository } from "@packages/core-kernel/src/services/config";
import { resolve } from "path";

let app: Application;
let pluginConfiguration: PluginConfiguration;

beforeEach(() => {
    app = new Application(new Container());
    pluginConfiguration = app.resolve<PluginConfiguration>(PluginConfiguration);
});

describe("PluginConfiguration", () => {
    it("should create an instance from a name and defaults", () => {
        app.get<ConfigRepository>(Identifiers.ConfigRepository).set("app.pluginOptions", {
            dummy: { key: "value" },
        });

        const instance: PluginConfiguration = pluginConfiguration.from("dummy", { some: "value" });

        expect(instance.all()).toEqual({ some: "value", key: "value" });
    });

    it("should discover the defaults for the given plugin", () => {
        pluginConfiguration.discover(
            "stub-plugin-with-defaults",
            resolve(__dirname, "../__stubs__/stub-plugin-with-defaults"),
        );

        expect(pluginConfiguration.all()).toEqual({ defaultKey: "defaultValue" });
    });

    it("should set and get the given value", () => {
        pluginConfiguration.set("key", "value");

        expect(pluginConfiguration.all()).toEqual({ key: "value" });
        expect(pluginConfiguration.get("key")).toBe("value");
        expect(pluginConfiguration.has("key")).toBeTrue();
        expect(pluginConfiguration.getOptional("key", "default value")).toBe("value");
        expect(pluginConfiguration.getRequired("key")).toBe("value");

        pluginConfiguration.unset("key");

        expect(pluginConfiguration.all()).toEqual({});
        expect(pluginConfiguration.get("key")).toBeUndefined();
        expect(pluginConfiguration.has("key")).toBeFalse();
        expect(pluginConfiguration.getOptional("key", "default value")).toBe("default value");
        expect(() => pluginConfiguration.getRequired("key")).toThrow();
    });

    it("should throw when using deprecated get default value argument", () => {
        expect(() => pluginConfiguration.get("key", "default value")).toThrow();
    });

    describe("merge", () => {
        it("should merge the given value", () => {
            pluginConfiguration.set("key", "value");
            pluginConfiguration.merge({ some: "value" });

            expect(pluginConfiguration.all()).toEqual({ some: "value", key: "value" });
        });

        it("should merge nested object", () => {
            pluginConfiguration.set("key", {
                "1": {
                    "1.1": "test",
                },
            });
            pluginConfiguration.merge({
                key: {
                    "1": {
                        "1.2": "test",
                    },
                },
            });

            expect(pluginConfiguration.all()).toEqual({
                key: {
                    "1": {
                        "1.1": "test",
                        "1.2": "test",
                    },
                },
            });
        });

        it("should override array", () => {
            pluginConfiguration.set("key", [1, 2, 3]);
            pluginConfiguration.merge({
                key: [3, 4, 5],
            });

            expect(pluginConfiguration.all()).toEqual({
                key: [3, 4, 5],
            });
        });
    });
});
