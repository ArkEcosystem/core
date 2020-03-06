import "jest-extended";

import { Console } from "@arkecosystem/core-test-framework";
import { Environment } from "@packages/core-cli/src/services";
import envfile from "envfile";
import fs from "fs-extra";

let cli;
let environment;

beforeEach(() => {
    cli = new Console();

    environment = cli.app.resolve(Environment);
});

afterEach(() => jest.resetAllMocks());

describe("Environment", () => {
    it("should get all paths for the given token and network", async () => {
        expect(environment.getPaths("ark", "testnet")).toContainAllKeys(["data", "config", "cache", "log", "temp"]);
    });

    it("should respect the CORE_PATH_CONFIG environment variable", async () => {
        process.env.CORE_PATH_CONFIG = "something";

        expect(environment.getPaths("ark", "testnet").config).toEndWith("/something");
    });

    it("should respect the CORE_PATH_DATA environment variable", async () => {
        process.env.CORE_PATH_DATA = "something";

        expect(environment.getPaths("ark", "testnet").data).toEndWith("/something");
    });

    it("should fail to update the variables if the file doesn't exist", async () => {
        expect(() => environment.updateVariables("some-file", {})).toThrowError(
            "No environment file found at some-file.",
        );
    });

    it("should update the variables", async () => {
        // Arrange
        const existsSync = jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);
        const parseFileSync = jest.spyOn(envfile, "parseFileSync").mockImplementation(() => ({}));
        const writeFileSync = jest.spyOn(fs, "writeFileSync").mockImplementation();

        // Act
        environment.updateVariables("stub", { key: "value" });

        // Assert
        expect(existsSync).toHaveBeenCalledWith("stub");
        expect(parseFileSync).toHaveBeenCalledWith("stub");
        expect(writeFileSync).toHaveBeenCalledWith("stub", "key=value");

        // Reset
        existsSync.mockReset();
        parseFileSync.mockReset();
        writeFileSync.mockReset();
    });
});
