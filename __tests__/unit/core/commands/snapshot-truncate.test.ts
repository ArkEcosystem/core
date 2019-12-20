import { Console } from "@arkecosystem/core-test-framework";

import { Command } from "@packages/core/src/commands/snapshot-truncate";

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

describe.skip("TruncateCommand", () => {
    it("should be called if the snapshot service is available", async () => {
        app.isBound = jest.fn().mockReturnValue(true);

        const truncate = jest.fn();
        app.get = jest.fn().mockReturnValue({ truncate });

        await cli.execute(Command);

        await expect(truncate).toHaveBeenCalled();
    });

    it("should throw if the snapshot service is not available", async () => {
        app.isBound = jest.fn().mockReturnValue(false);

        await expect(cli.execute(Command)).rejects.toThrow("The @arkecosystem/core-snapshots plugin is not installed.");
    });
});
