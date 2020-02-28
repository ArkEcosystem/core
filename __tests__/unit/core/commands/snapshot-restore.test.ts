import { Console } from "@arkecosystem/core-test-framework";
import { dirSync, setGracefulCleanup } from "tmp";
import { Command } from "@packages/core/src/commands/snapshot-restore";
import { ensureDirSync } from "fs-extra";
import prompts from "prompts";

export const app = {
    bootstrap: jest.fn(),
    boot: jest.fn(),
    isBound: jest.fn(),
    get: jest.fn(),
};

// jest.mock("@arkecosystem/core-kernel", () => ({
//     __esModule: true,
//     Application: jest.fn(() => app),
//     Container: {
//         Container: jest.fn(),
//         Identifiers: {
//             BlockchainService: Symbol("BlockchainService"),
//         },
//     },
// }));

let cli;
beforeEach(() => (cli = new Console()));

afterAll(() => setGracefulCleanup());

describe.skip("RestoreCommand", () => {
    it("should be called if a snapshot is specified via flag", async () => {
        app.isBound = jest.fn().mockReturnValue(true);

        const restore = jest.fn();
        app.get = jest.fn().mockReturnValue({ listen: jest.fn(), import: restore });

        await cli.execute(Command, { flags: { blocks: 1 } });

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

        await cli.execute(Command);

        await expect(restore).toHaveBeenCalled();
    });

    it("should throw if the snapshot service is not available", async () => {
        app.isBound = jest.fn().mockReturnValue(false);

        await expect(cli.execute(Command)).rejects.toThrow("The @arkecosystem/core-snapshots plugin is not installed.");
    });
});
