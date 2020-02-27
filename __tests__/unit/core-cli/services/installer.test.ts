import "jest-extended";

import { Console } from "@arkecosystem/core-test-framework";
import { setGracefulCleanup } from "tmp";
// import path from "path";

import { Installer } from "@packages/core-cli/src/services";

import execa from "../../../../__mocks__/execa";

let cli;
let installer;

beforeAll(() => setGracefulCleanup());

beforeEach(() => {
    cli = new Console();

    installer = cli.app.resolve(Installer);
});

afterEach(() => jest.resetAllMocks());

describe("Installer", () => {
    describe("#install", () => {
        it("should be ok if [stdout] output is present", () => {
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: "stdout",
                stderr: undefined,
            });

            installer.install("@arkecosystem/core");

            expect(spySync).toHaveBeenCalledWith("yarn global add @arkecosystem/core", { shell: true });
        });

        it("should not be ok if [stderr] output is present", () => {
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: "stdout",
                stderr: "stderr",
            });

            expect(() => installer.install("@arkecosystem/core")).toThrow("stderr");

            expect(spySync).toHaveBeenCalledWith("yarn global add @arkecosystem/core", { shell: true });
        });
    });

    describe("#installFromChannel", () => {
        it("should be ok if no [stderr] output is present", () => {
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: "stdout",
                stderr: undefined,
            });

            installer.installFromChannel("@arkecosystem/core", "latest");

            expect(spySync).toHaveBeenCalledWith("yarn global add @arkecosystem/core@latest", { shell: true });
        });

        it("should be not ok if [stderr] output is present", () => {
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: "stdout",
                stderr: "stderr",
            });

            expect(() => installer.installFromChannel("@arkecosystem/core", "latest")).toThrow("stderr");

            expect(spySync).toHaveBeenCalledWith("yarn global add @arkecosystem/core@latest", { shell: true });
        });
    });
});
