import "jest-extended";

import { Console } from "@arkecosystem/core-test-framework";
// import path from "path";
import { Installer } from "@packages/core-cli/src/services";
import { setGracefulCleanup } from "tmp";

import execa from "../../../../__mocks__/execa";

let cli;
let installer;

beforeAll(() => setGracefulCleanup());

beforeEach(() => {
    cli = new Console();

    installer = cli.app.resolve(Installer);
});

afterEach(() => jest.resetAllMocks());

describe("Installer.install", () => {
    it("should install latest package when tag isn't provided", () => {
        const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
            stdout: "stdout",
            exitCode: 0,
        });

        installer.install("@arkecosystem/core");

        expect(spySync).toHaveBeenCalledWith("yarn global add @arkecosystem/core@latest", { shell: true });
    });

    it("should install specific package when tag is provided", () => {
        const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
            stdout: "stdout",
            exitCode: 0,
        });

        installer.install("@arkecosystem/core", "3.0.0");

        expect(spySync).toHaveBeenCalledWith("yarn global add @arkecosystem/core@3.0.0", { shell: true });
    });

    it("should throw when exit code isn't 0", () => {
        const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
            stderr: "stderr",
            exitCode: 1,
        });

        expect(() => installer.install("@arkecosystem/core")).toThrow("stderr");
    });
});
