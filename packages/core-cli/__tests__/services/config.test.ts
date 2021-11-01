import "jest-extended";

import { Console } from "@arkecosystem/core-test-framework";
import { Config } from "@packages/core-cli/src/services";
import { writeFileSync } from "fs";
import { setGracefulCleanup } from "tmp";

let cli;
let config;
let configPath;

beforeAll(() => setGracefulCleanup());

beforeEach(() => {
    cli = new Console();

    config = cli.app.resolve(Config);
    configPath = cli.app.getConsolePath("config", "config.json");
});

afterEach(() => jest.resetAllMocks());

describe("Config", () => {
    it("should return all configurations", () => {
        expect(config.all()).toEqual({
            channel: "next",
            plugins: [],
            token: "ark",
        });
    });

    it("should setup a new config with default values", () => {
        expect(config.get("token")).toBe("ark");
        expect(config.get("channel")).toBeOneOf(["latest", "next"]);
    });

    it("should set and get a value", () => {
        expect(config.get("token")).toBe("ark");

        config.set("token", "btc");

        expect(config.get("token")).toBe("btc");

        config.forget("token", "btc");

        expect(config.get("token")).toBeUndefined();

        config.set("token", "btc");

        expect(config.get("token")).toBe("btc");
    });

    describe("#load", () => {
        it("should restore the defaults if the config has been corrupted", () => {
            writeFileSync(configPath, "junk");

            const restoreDefaults = jest.spyOn(config, "restoreDefaults");

            config.load("token");

            expect(restoreDefaults).toHaveBeenCalled();
        });
    });

    describe("#save", () => {
        it("should restore the defaults if the config has been corrupted", () => {
            expect(config.get("token")).toBe("ark");
            expect(config.get("channel")).toBe("next");
            expect(config.get("plugins")).toEqual([]);

            config.set("token", "btc");
            config.set("channel", "latest");
            config.set("plugins", ["something"]);

            config.save("token");

            expect(config.get("token")).toBe("btc");
            expect(config.get("channel")).toBe("latest");
            expect(config.get("plugins")).toEqual(["something"]);
        });
    });

    describe("#restoreDefaults", () => {
        it("should restore the defaults if the config has been corrupted", () => {
            config.store = [];

            expect(config.store).toBeArray();
            expect(config.get("token")).toBeUndefined();
            expect(config.get("channel")).toBeUndefined();
            expect(config.get("plugins")).toBeUndefined();

            config.restoreDefaults();

            expect(config.store).toBeObject();
            expect(config.get("token")).toBe("ark");
            expect(config.get("channel")).toBe("next");
            expect(config.get("plugins")).toEqual([]);
        });
    });

    describe("#getRegistryChannel", () => {
        it("should return latest", () => {
            expect(config.getRegistryChannel("3.0.0")).toEqual("latest");
        });

        it("should return next", () => {
            expect(config.getRegistryChannel("3.0.0-next.9")).toEqual("next");
        });
    });
});
