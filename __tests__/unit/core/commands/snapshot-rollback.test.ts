import { Console } from "@arkecosystem/core-test-framework";

import { Command } from "@packages/core/src/commands/snapshot-rollback";

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

describe.skip("RollbackCommand", () => {
    it("should call [rollbackByHeight] if a height is given", async () => {
        app.isBound = jest.fn().mockReturnValue(true);

        const rollbackByHeight = jest.fn();
        app.get = jest.fn().mockReturnValue({ rollbackByHeight });

        await cli.execute(Command, { flags: { height: 1 } });

        await expect(rollbackByHeight).toHaveBeenCalled();
    });

    it("should call [rollbackByNumber] if a number is given", async () => {
        app.isBound = jest.fn().mockReturnValue(true);

        const rollbackByNumber = jest.fn();
        app.get = jest.fn().mockReturnValue({ rollbackByNumber });

        await cli.execute(Command, { flags: { number: 1 } });

        await expect(rollbackByNumber).toHaveBeenCalled();
    });

    it("should throw if no height or number is given", async () => {
        app.isBound = jest.fn().mockReturnValue(true);

        await expect(cli.execute(Command)).rejects.toThrow(
            "Please specify either a height or number of blocks to roll back.",
        );
    });

    it("should throw if the snapshot service is not available", async () => {
        app.isBound = jest.fn().mockReturnValue(false);

        await expect(cli.execute(Command)).rejects.toThrow("The @arkecosystem/core-snapshots plugin is not installed.");
    });
});
