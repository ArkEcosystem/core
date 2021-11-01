import "jest-extended";

import { Commands, Services } from "@packages/core-cli";
import { CommandLineInterface } from "@packages/core/src/cli";
import envPaths from "env-paths";
import prompts from "prompts";

beforeEach(() => {
    process.exitCode = undefined;
});

afterEach(() => jest.clearAllMocks());

describe("CLI", () => {
    it("should run successfully using valid commands", async () => {
        const cli = new CommandLineInterface(["help"]);
        await expect(cli.execute("./packages/core/dist")).toResolve();
    });

    it("should fail when the dirname isn't properly configured", async () => {
        const cli = new CommandLineInterface(["help"]);
        // default dirname runs from a specific relative file location
        await expect(cli.execute()).toReject();
    });

    it("should set exitCode = 2 when using invalid commands", async () => {
        let message: string;
        jest.spyOn(console, "warn").mockImplementationOnce((m: string) => (message = m));
        const spyOnCheck = jest.spyOn(Services.Updater.prototype, "check").mockImplementation();

        const cli = new CommandLineInterface(["hello"]);
        prompts.inject([false]);
        await cli.execute("./packages/core/dist");

        expect(spyOnCheck).toBeCalled();
        expect(message).toContain(`is not a ark command.`);
        expect(process.exitCode).toEqual(2);
    });

    it("should set exitCode = 2 when the command doesn't have a valid signature", async () => {
        const cli = new CommandLineInterface(["--nope"]);
        await cli.execute("./packages/core/dist");
        expect(process.exitCode).toEqual(2);
    });

    it("should not set exitCode when a valid command appears with the help flag", async () => {
        const cli = new CommandLineInterface(["update", "--help"]);
        await expect(cli.execute("./packages/core/dist")).toResolve();
        expect(process.exitCode).toEqual(undefined);
    });

    it("should execute a suggested command", async () => {
        // @ts-ignore
        const mockExit = jest.spyOn(process, "exit").mockImplementation(() => {});
        const cli = new CommandLineInterface(["hello"]);
        prompts.inject([true]);
        await expect(cli.execute("./packages/core/dist")).toResolve();
        expect(mockExit).not.toHaveBeenCalled();
    });

    describe("discover plugins", () => {
        it("should load CLI plugins from folder using provided token and network", async () => {
            const spyOnList = jest.spyOn(Services.PluginManager.prototype, "list").mockResolvedValueOnce([
                // @ts-ignore
                {
                    path: "test/path",
                },
            ]);

            const spyOnFrom = jest
                .spyOn(Commands.DiscoverCommands.prototype, "from")
                // @ts-ignore
                .mockReturnValueOnce({ plugin: {} });

            const token = "dummy";
            const network = "testnet";

            const cli = new CommandLineInterface(["help", `--token=${token}`, `--network=${network}`]);
            await expect(cli.execute("./packages/core/dist")).toResolve();

            expect(spyOnList).toHaveBeenCalledWith(token, network);

            expect(spyOnFrom).toHaveBeenCalled();
        });

        it("should load CLI plugins from folder using CORE_PATH_CONFIG", async () => {
            const spyOnList = jest.spyOn(Services.PluginManager.prototype, "list").mockResolvedValueOnce([]);
            process.env.CORE_PATH_CONFIG = __dirname;

            const cli = new CommandLineInterface(["help"]);
            await expect(cli.execute("./packages/core/dist")).toResolve();

            expect(spyOnList).toHaveBeenCalledWith("dummyToken", "testnet");

            delete process.env.CORE_PATH_CONFIG;
        });

        it("should load CLI plugins from folder using detected network folder", async () => {
            const spyOnList = jest.spyOn(Services.PluginManager.prototype, "list").mockResolvedValueOnce([]);

            const spyOnDiscoverNetwork = jest
                .spyOn(Commands.DiscoverNetwork.prototype, "discover")
                .mockResolvedValueOnce("testnet");

            const cli = new CommandLineInterface(["help"]);
            await expect(cli.execute("./packages/core/dist")).toResolve();

            expect(spyOnList).toHaveBeenCalledWith("ark", "testnet");
            expect(spyOnDiscoverNetwork).toHaveBeenCalledWith(envPaths("ark", { suffix: "core" }).config);
        });

        it("should not load CLI plugins if network is not provided", async () => {
            const spyOnList = jest.spyOn(Services.PluginManager.prototype, "list").mockResolvedValueOnce([]);

            const token = "dummy";

            const cli = new CommandLineInterface(["help", `--token=${token}`]);
            await expect(cli.execute("./packages/core/dist")).toResolve();

            expect(spyOnList).not.toHaveBeenCalled();
        });
    });
});
