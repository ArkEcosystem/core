import "jest-extended";

import { Identifiers } from "@packages/core-manager/src/ioc";
import { CliManager } from "@packages/core-manager/src/utils/cli-manager";
import { Sandbox } from "@packages/core-test-framework";

let sandbox: Sandbox;
let cliManager: CliManager;

let mockCommand;

beforeEach(() => {
    mockCommand = {
        register: jest.fn(),
        run: jest.fn(),
    };

    const mockDiscoverCommands = {
        within: jest.fn().mockReturnValue({ command_name: mockCommand }),
    };

    const mockCliApplication = {
        resolve: jest.fn().mockReturnValue(mockDiscoverCommands),
    };

    sandbox = new Sandbox();

    sandbox.app.bind(Identifiers.CLI).toConstantValue(mockCliApplication);

    cliManager = sandbox.app.resolve(CliManager);
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("CliManager", () => {
    it("should run command", async () => {
        await cliManager.runCommand("command_name");

        expect(mockCommand.register).toHaveBeenCalledTimes(1);
        expect(mockCommand.register).toHaveBeenCalledWith(["command_name", ""]);
        expect(mockCommand.run).toHaveBeenCalledTimes(1);
    });

    it("should run command with arguments", async () => {
        await cliManager.runCommand("command_name", "--network:testnet --token=ark");

        expect(mockCommand.register).toHaveBeenCalledTimes(1);
        expect(mockCommand.register).toHaveBeenCalledWith(["command_name", "--network:testnet", "--token=ark"]);
        expect(mockCommand.run).toHaveBeenCalledTimes(1);
    });

    it("should throw if command does not exist", async () => {
        await expect(cliManager.runCommand("invalid_command_name")).rejects.toThrow(
            "Command invalid_command_name does not exists.",
        );
    });
});
