import "jest-extended";

import { Console } from "@arkecosystem/core-test-framework";
import { setGracefulCleanup } from "tmp";

import { Config } from "@packages/core-cli/src/services";

let cli;
let config;

beforeAll(() => setGracefulCleanup());

beforeEach(() => {
    cli = new Console();

    config = cli.app.resolve(Config);
});

afterEach(() => jest.resetAllMocks());

describe("Config", () => {
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
});
