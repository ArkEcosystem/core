import "jest-extended";

import { Console } from "@arkecosystem/core-test-framework";
import { Command } from "@packages/core/src/commands/plugin-install";
import { setGracefulCleanup } from "tmp";

let called = false;
let packageExists = true;
const install = () => (called = true);
const exists = async () => packageExists;

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
    it("should throw an error when package doesn't exist", async () => {
        packageExists = false;
        const errorMessage = `The given package [${undefined}] is neither a git nor a npm package.`;
        await expect(cli.execute(Command)).rejects.toThrow(errorMessage);
        expect(called).toEqual(false);
    });

    it("should throw any errors while installing", async () => {
        jest.spyOn(cli.app, "getCorePath").mockImplementationOnce(() => {
            throw Error("Fake Error");
        });

        await expect(cli.execute(Command)).rejects.toThrow("Fake Error");
    });

    it("should call install on existing packages", async () => {
        packageExists = true;
        await expect(cli.execute(Command)).toResolve();
        expect(called).toEqual(true);
    });
});
