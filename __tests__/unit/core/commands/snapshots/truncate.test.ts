import { TruncateCommand } from "@packages/core/src/commands/snapshot/truncate";
import { app } from "@arkecosystem/core-kernel";

jest.mock("@arkecosystem/core-kernel");

describe("TruncateCommand", () => {
    it("should be called if the snapshot service is available", async () => {
        app.isBound = jest.fn().mockReturnValue(true);

        const truncate = jest.fn();
        app.get = jest.fn().mockReturnValue({ truncate });

        await TruncateCommand.run(["--token=ark", "--network=testnet"]);

        await expect(truncate).toHaveBeenCalled();
    });

    it("should throw if the snapshot service is not available", async () => {
        app.isBound = jest.fn().mockReturnValue(false);

        await expect(TruncateCommand.run(["--token=ark", "--network=testnet"])).rejects.toThrow(
            "The @arkecosystem/core-snapshots plugin is not installed.",
        );
    });
});
