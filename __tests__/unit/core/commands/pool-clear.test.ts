import "jest-extended";

import { Console } from "@packages/core-test-framework";
import { Command } from "@packages/core/src/commands/pool-clear";
import fs from "fs-extra";
import prompts from "prompts";

let cli;
beforeEach(() => {
    cli = new Console();
});

describe("PoolClearCommand", () => {
    it("should execute succesfully", async () => {
        const removeSync = jest.spyOn(fs, "removeSync");
        removeSync.mockImplementation(() => {});
        prompts.inject([true]);
        jest.spyOn(cli.app, "getCorePath").mockResolvedValueOnce(null);
        await expect(cli.execute(Command)).toResolve();
    });

    it("should throw any errors", async () => {
        const removeSync = jest.spyOn(fs, "removeSync");
        removeSync.mockImplementation(() => {
            throw Error("Fake Error");
        });
        prompts.inject([true]);
        jest.spyOn(cli.app, "getCorePath").mockResolvedValueOnce(null);
        await expect(cli.execute(Command)).rejects.toThrow("Fake Error");
    });
});
