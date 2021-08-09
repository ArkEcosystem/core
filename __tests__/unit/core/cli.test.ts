import "jest-extended";

import { CommandLineInterface } from "@packages/core/src/cli";
import { Commands } from "@packages/core-cli";
import prompts from "prompts";
import envPaths from "env-paths";
import { join } from "path";
import fs from "fs-extra";

afterEach(() => jest.resetAllMocks());

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

    it("should reject when using invalid commands", async () => {
        // @ts-ignore
        const mockExit = jest.spyOn(process, "exit").mockImplementation(() => {});
        let message: string;
        jest.spyOn(console, "warn").mockImplementationOnce((m) => (message = m));

        const cli = new CommandLineInterface(["hello"]);
        prompts.inject([false]);
        await expect(cli.execute("./packages/core/dist")).toReject();

        expect(message).toContain(`is not a ark command.`);
        expect(mockExit).toHaveBeenCalled();
    });

    it("should exit when the command doesn't have a valid signature", async () => {
        // @ts-ignore
        const mockExit = jest.spyOn(process, "exit").mockImplementation(() => {});
        const cli = new CommandLineInterface(["--nope"]);
        await expect(cli.execute("./packages/core/dist")).toReject();
        expect(mockExit).toHaveBeenCalled();
    });

    it("should exit when a valid command appears with the help flag", async () => {
        // @ts-ignore
        const mockExit = jest.spyOn(process, "exit").mockImplementation(() => {});
        const cli = new CommandLineInterface(["update", "--help"]);
        await expect(cli.execute("./packages/core/dist")).toResolve();
        expect(mockExit).toHaveBeenCalled();
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
        it("should not load CLI plugins if cannot detect plugins folder", async () => {
            const spyOnDiscover = jest.spyOn(Commands.DiscoverPlugins.prototype, "discover").mockResolvedValueOnce([]);

            const cli = new CommandLineInterface(["help"]);
            await expect(cli.execute("./packages/core/dist")).toResolve();

            expect(spyOnDiscover).not.toHaveBeenCalled();
        })

        it("should load CLI plugins from folder using provided token and network", async () => {
            const spyOnDiscover = jest.spyOn(Commands.DiscoverPlugins.prototype, "discover").mockResolvedValueOnce([]);

            const token = "dummy";
            const network = "testnet";

            const cli = new CommandLineInterface(["help" ,`--token=${token}`, `--network=${network}`]);
            await expect(cli.execute("./packages/core/dist")).toResolve();

            expect(spyOnDiscover).toHaveBeenCalledWith(join(envPaths(token, { suffix: "core" }).data, network, "plugins"));
        })

        it("should load CLI plugins from folder using CORE_PATH_CONFIG", async () => {
            const spyOnDiscover = jest.spyOn(Commands.DiscoverPlugins.prototype, "discover").mockResolvedValueOnce([]);

            process.env.CORE_PATH_CONFIG = __dirname;

            const cli = new CommandLineInterface(["help"]);
            await expect(cli.execute("./packages/core/dist")).toResolve();

            expect(spyOnDiscover).toHaveBeenCalledWith(join(envPaths("dummyToken", { suffix: "core" }).data, "testnet", "plugins"));

            delete process.env.CORE_PATH_CONFIG;
        })

        it("should load CLI plugins from folder using detected network folder", async () => {
            const spyOnDiscover = jest.spyOn(Commands.DiscoverPlugins.prototype, "discover").mockResolvedValueOnce([]);

            const original = fs.readdirSync
            // @ts-ignore
            jest.spyOn(fs, "readdirSync").mockImplementationOnce(original).mockImplementationOnce(() => ["testnet"]);

            const cli = new CommandLineInterface(["help"]);
            await expect(cli.execute("./packages/core/dist")).toResolve();

            expect(spyOnDiscover).toHaveBeenCalledWith(join(envPaths("ark", { suffix: "core" }).data, "testnet", "plugins"));
        })
    })
});
