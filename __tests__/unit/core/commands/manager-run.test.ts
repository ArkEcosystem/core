import { Command } from "@packages/core/src/commands/manager-run";
import { executeCommand } from "../__support__/app";

const app = {
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

beforeEach(() => {
});

describe("RunCommand", () => {
    it("should throw if the process does not exist", async () => {
        const spyBootstrap = jest.spyOn(app, "bootstrap").mockImplementation(undefined);
        const spyBoot = jest.spyOn(app, "boot").mockImplementation(undefined);

        await executeCommand(Command);

        expect(spyBootstrap).toHaveBeenCalled();
        expect(spyBoot).toHaveBeenCalled();
    });
});
