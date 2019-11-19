import { RunCommand } from "@packages/core/src/commands/relay/run";

export const app = {
    bootstrap: jest.fn(),
    boot: jest.fn(),
};

jest.mock("@arkecosystem/core-kernel", () => ({
    __esModule: true,
    Application: jest.fn(() => app),
    Container: {
        Container: jest.fn(),
    },
}));

describe("RunCommand", () => {
    it("should throw if the process does not exist", async () => {
        const spyBootstrap = jest.spyOn(app, "bootstrap").mockImplementation(undefined);
        const spyBoot = jest.spyOn(app, "boot").mockImplementation(undefined);

        await RunCommand.run(["--token=ark", "--network=testnet"]);

        expect(spyBootstrap).toHaveBeenCalled();
        expect(spyBoot).toHaveBeenCalled();
    });
});
