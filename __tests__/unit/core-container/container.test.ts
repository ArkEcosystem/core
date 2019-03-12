import "jest-extended";

import { asValue } from "awilix";
import { resolve } from "path";
import { app } from "../../../packages/core-container/src";

const dummyPlugin = {
    name: "dummy",
    version: "0.1.0",
    plugin: { key: "value" },
    options: { key: "value" },
};

beforeEach(async () => {
    process.env.CORE_PATH_CONFIG = resolve(__dirname, "../../core/src/config/testnet");

    await app.setUp(
        "2.0.0",
        {
            token: "ark",
            network: "testnet",
        },
        {
            skipPlugins: true,
        },
    );
});

describe("Container", () => {
    it("should add a new registration", () => {
        app.register("fake", asValue("value"));

        expect(app.has("fake")).toBeTruthy();
        expect(app.has("unregistered")).toBeFalsy();
    });

    it("should resolve a registration", () => {
        app.register("fake", asValue("value"));

        expect(app.resolve("fake")).toBe("value");
    });

    it("should resolve a plugin", () => {
        app.register("fake", asValue(dummyPlugin));

        expect(app.resolvePlugin("fake")).toEqual(dummyPlugin.plugin);
    });

    it("should resolve the options of a plugin", () => {
        app.register("fake", asValue(dummyPlugin));

        expect(app.resolveOptions("fake")).toEqual(dummyPlugin.options);
    });

    it("should determine if a registration exists", () => {
        app.register("fake", asValue("value"));

        expect(app.has("fake")).toBeTrue();
    });

    it("should determine if a registration exists", () => {
        app.register("fake", asValue("value"));

        expect(app.has("fake")).toBeTrue();
    });

    it("should get the hashid", () => {
        expect(app.getHashid()).toBeString();
    });

    it("should get the version", () => {
        expect(app.getVersion()).toBe("2.0.0");
    });

    it("should set the version", () => {
        expect(app.getVersion()).toBe("2.0.0");

        app.setVersion("3.0.0");

        expect(app.getVersion()).toBe("3.0.0");
    });

    it("should resolve and export paths", () => {
        expect(process.env.CORE_PATH_CONFIG).toEqual(resolve(__dirname, "../../core/src/config/testnet"));
    });
});
