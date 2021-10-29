import "jest-extended";

import { Console } from "@packages/core-test-framework";
import { Command } from "@packages/core/src/commands/pool-clear";
import fs from "fs-extra";
import prompts from "prompts";

let cli;
beforeEach(() => {
    cli = new Console();
});

afterEach(() => jest.clearAllMocks());

describe("PoolClearCommand", () => {
    it("should execute succesfully", async () => {
        const removeSync = jest.spyOn(fs, "removeSync");
        removeSync.mockImplementation(() => {});
        prompts.inject([true]);
        jest.spyOn(cli.app, "getCorePath").mockResolvedValueOnce(null);
        await expect(cli.execute(Command)).toResolve();
        expect(removeSync).toHaveBeenCalled();
    });

    it("should throw any errors", async () => {
        const removeSync = jest.spyOn(fs, "removeSync");
        removeSync.mockImplementation(() => {
            throw Error("Fake Error");
        });
        prompts.inject([true]);
        jest.spyOn(cli.app, "getCorePath").mockResolvedValueOnce(null);
        await expect(cli.execute(Command)).rejects.toThrow("Fake Error");
        expect(removeSync).toHaveBeenCalled();
    });

    it("should do nothing when prompt confirmation is false", async () => {
        const removeSync = jest.spyOn(fs, "removeSync");
        removeSync.mockImplementation(() => {});
        prompts.inject([false]);
        jest.spyOn(cli.app, "getCorePath").mockResolvedValueOnce(null);
        await expect(cli.execute(Command)).toResolve();
        expect(removeSync).not.toHaveBeenCalled();
    });

    it("should remove files using flags", async () => {
        const removeSync = jest.spyOn(fs, "removeSync");
        removeSync.mockImplementation(() => {});
        prompts.inject([true]);
        jest.spyOn(cli.app, "getCorePath").mockResolvedValueOnce(null);
        await expect(cli.withFlags({ false: true }).execute(Command)).toResolve();
        expect(removeSync).toHaveBeenCalled();
    });
});
