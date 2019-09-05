import { RollbackCommand } from "@packages/core/src/commands/snapshot/rollback";
import { app } from "@arkecosystem/core-kernel";

jest.mock("@arkecosystem/core-kernel");

describe("RollbackCommand", () => {
    it("should call [rollbackByHeight] if a height is given", async () => {
        app.isBound = jest.fn().mockReturnValue(true);

        const rollbackByHeight = jest.fn();
        app.get = jest.fn().mockReturnValue({ rollbackByHeight });

        await RollbackCommand.run(["--token=ark", "--network=testnet", "--height=1"]);

        await expect(rollbackByHeight).toHaveBeenCalled();
    });

    it("should call [rollbackByNumber] if a number is given", async () => {
        app.isBound = jest.fn().mockReturnValue(true);

        const rollbackByNumber = jest.fn();
        app.get = jest.fn().mockReturnValue({ rollbackByNumber });

        await RollbackCommand.run(["--token=ark", "--network=testnet", "--number=1"]);

        await expect(rollbackByNumber).toHaveBeenCalled();
    });

    it("should throw if no height or number is given", async () => {
        app.isBound = jest.fn().mockReturnValue(true);

        await expect(RollbackCommand.run(["--token=ark", "--network=testnet"])).rejects.toThrow(
            "Please specify either a height or number of blocks to roll back.",
        );
    });

    it("should throw if the snapshot service is not available", async () => {
        app.isBound = jest.fn().mockReturnValue(false);

        await expect(RollbackCommand.run(["--token=ark", "--network=testnet"])).rejects.toThrow(
            "The @arkecosystem/core-snapshots plugin is not installed.",
        );
    });
});
