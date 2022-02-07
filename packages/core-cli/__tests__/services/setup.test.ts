import "jest-extended";

import { Setup } from "@packages/core-cli/src/services/setup";
import { join } from "path";

import execa from "../__mocks__/execa";

let setup: Setup;
const globalDir = "/pnpm/global/dir";

beforeEach(() => {
    setup = new Setup();
});

afterEach(() => {
    jest.resetAllMocks();
});

describe("Setup", () => {
    describe("isGlobal", () => {
        it("should return false if package is installed locally", () => {
            jest.spyOn(execa, "sync").mockReturnValue({
                stdout: globalDir,
                exitCode: 0,
            });

            expect(setup.isGlobal()).toBeFalse();
        });

        it("should return false if pnpm is not installed", () => {
            jest.spyOn(execa, "sync").mockReturnValue({
                stdout: "",
                exitCode: 1,
            });

            expect(setup.isGlobal()).toBeFalse();
        });

        it("should return true if package is installed globally", () => {
            jest.spyOn(execa, "sync").mockReturnValue({
                stdout: globalDir,
                exitCode: 0,
            });

            jest.spyOn(setup, "getRootPath").mockReturnValue(join(globalDir, "/path/to/package"));

            expect(setup.isGlobal()).toBeTrue();
        });

        it("should get root using 'pnpm root -g dir' command", () => {
            const spyOnSync = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: globalDir,
                exitCode: 0,
            });

            setup.isGlobal();

            expect(spyOnSync).toHaveBeenCalledWith("pnpm root -g dir", { shell: true });
        });
    });
});
