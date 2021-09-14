import "jest-extended";

import { Application } from "@packages/core-kernel/src/application";
import { Container, Identifiers, interfaces } from "@packages/core-kernel/src/ioc";
import { PluginManifest } from "@packages/core-kernel/src/providers/plugin-manifest";
import { ConfigRepository } from "@packages/core-kernel/src/services/config";
import { resolve } from "path";

let app: Application;
let container: interfaces.Container;
let pluginManifest: PluginManifest;

beforeEach(() => {
    container = new Container();
    container.snapshot();

    app = new Application(container);
    app.bind(Identifiers.ConfigRepository).to(ConfigRepository).inSingletonScope();

    pluginManifest = app.resolve<PluginManifest>(PluginManifest);
});

afterEach(() => container.restore());

describe("PluginManifest", () => {
    it("should discover the manifest for the given plugin", () => {
        pluginManifest.discover(resolve(__dirname, "../__stubs__/stub-plugin"));

        expect(pluginManifest.has("name")).toBeTrue();
        expect(pluginManifest.get("name")).toBe("stub-plugin");
    });

    it("should merge the given value", () => {
        // @ts-ignore
        pluginManifest.merge({ some: "value" });

        expect(pluginManifest.get("some")).toEqual("value");
    });
});
