import { ReplayCommand } from "@packages/core/src/commands/chain/replay";

export const app = {
    bootstrap: jest.fn(),
    boot: jest.fn(),
    isBound: jest.fn(),
    get: jest.fn(),
};

jest.mock("@arkecosystem/core-kernel", () => ({
    __esModule: true,
    Application: jest.fn(() => app),
    Container: {
        Container: jest.fn(),
        Identifiers: {
            BlockchainService: Symbol("BlockchainService"),
        },
    },
}));

describe("ReplayCommand", () => {
    it("should be called if the blockchain service is available", async () => {
        app.isBound = jest.fn().mockReturnValue(true);

        const replay = jest.fn();
        app.get = jest.fn().mockReturnValue({ replay });

        await ReplayCommand.run(["--token=ark", "--network=testnet"]);

        await expect(replay).toHaveBeenCalled();
    });

    it("should throw if the blockchain service is not available", async () => {
        app.isBound = jest.fn().mockReturnValue(false);

        await expect(ReplayCommand.run(["--token=ark", "--network=testnet"])).rejects.toThrow(
            "The @arkecosystem/core-blockchain plugin is not installed.",
        );
    });
});
