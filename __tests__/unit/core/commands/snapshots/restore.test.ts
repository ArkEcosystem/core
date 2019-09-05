import { dirSync, setGracefulCleanup } from "tmp";
import { RestoreCommand } from "@packages/core/src/commands/snapshot/restore";
import { ensureDirSync } from "fs-extra";
import prompts from "prompts";
import { app } from "@arkecosystem/core-kernel";

jest.mock("@arkecosystem/core-kernel");

afterAll(() => setGracefulCleanup());

describe("RestoreCommand", () => {
    it("should be called if a snapshot is specified via flag", async () => {
        app.isBound = jest.fn().mockReturnValue(true);

        const restore = jest.fn();
        app.get = jest.fn().mockReturnValue({ listen: jest.fn(), import: restore });

        await RestoreCommand.run(["--token=ark", "--network=testnet", "--blocks=1"]);

        await expect(restore).toHaveBeenCalled();
    });

    it("should be called if a snapshot is specified via prompt", async () => {
        process.env.CORE_PATH_DATA = dirSync().name;

        ensureDirSync(`${process.env.CORE_PATH_DATA}/snapshots`);
        ensureDirSync(`${process.env.CORE_PATH_DATA}/snapshots/1`);

        app.isBound = jest.fn().mockReturnValue(true);

        const restore = jest.fn();
        app.get = jest.fn().mockReturnValue({ listen: jest.fn(), import: restore });

        prompts.inject(["1"]);

        await RestoreCommand.run(["--token=ark", "--network=testnet"]);

        await expect(restore).toHaveBeenCalled();
    });

    it("should throw if the snapshot service is not available", async () => {
        app.isBound = jest.fn().mockReturnValue(false);

        await expect(RestoreCommand.run(["--token=ark", "--network=testnet"])).rejects.toThrow(
            "The @arkecosystem/core-snapshots plugin is not installed.",
        );
    });
});
