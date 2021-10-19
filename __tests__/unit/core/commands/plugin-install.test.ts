import "jest-extended";

import { Console } from "@arkecosystem/core-test-framework";
import { Command } from "@packages/core/src/commands/plugin-install";
import { setGracefulCleanup } from "tmp";

const packageName = "dummyPackageName";
const install = jest.fn();
const exists = jest.fn().mockReturnValue(false);

jest.mock("@packages/core/src/source-providers/npm", () => ({
    NPM: jest.fn().mockImplementation(() => ({
        exists,
        install,
    })),
}));

jest.mock("@packages/core/src/source-providers/git", () => ({
    Git: jest.fn().mockImplementation(() => ({
        exists,
        install,
    })),
}));

jest.mock("@packages/core/src/source-providers/file", () => ({
    File: jest.fn().mockImplementation(() => ({
        exists,
        install,
    })),
}));

let cli;
beforeEach(() => {
    process.argv = ["", "test"];

    cli = new Console();
});

afterEach(() => {
    jest.clearAllMocks();
    setGracefulCleanup();
});

describe("PluginInstallCommand", () => {
    it("should throw an error when package name is not provided", async () => {
        const errorMessage = `"package" is required`;
        await expect(cli.execute(Command)).rejects.toThrow(errorMessage);

        expect(exists).not.toHaveBeenCalled();
        expect(install).not.toHaveBeenCalled();
    });

    it("should throw an error when package doesn't exist", async () => {
        const errorMessage = `The given package [${packageName}] is neither a git nor a npm package.`;
        await expect(cli.withArgs([packageName]).execute(Command)).rejects.toThrow(errorMessage);

        expect(exists).toHaveBeenCalledWith(packageName, undefined);
        expect(install).not.toHaveBeenCalled();
    });

    it("should throw any errors while installing", async () => {
        exists.mockReturnValue(true);

        jest.spyOn(cli.app, "getCorePath").mockImplementationOnce(() => {
            throw Error("Fake Error");
        });

        await expect(cli.withArgs([packageName]).execute(Command)).rejects.toThrow("Fake Error");
    });

    it("should call install on existing packages", async () => {
        exists.mockReturnValue(true);

        await expect(cli.withArgs([packageName]).execute(Command)).toResolve();

        expect(exists).toHaveBeenCalledWith(packageName, undefined);
        expect(install).toHaveBeenCalledWith(packageName, undefined);
    });

    it("should call install on existing packages with --version flag", async () => {
        exists.mockReturnValue(true);

        const version = "3.0.0";
        await expect(cli.withArgs([packageName]).withFlags({ version }).execute(Command)).toResolve();

        expect(exists).toHaveBeenCalledWith(packageName, version);
        expect(install).toHaveBeenCalledWith(packageName, version);
    });
});
