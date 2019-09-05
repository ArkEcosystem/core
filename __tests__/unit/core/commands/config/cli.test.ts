import { dirSync, setGracefulCleanup } from "tmp";

import { CommandLineInterfaceCommand } from "@packages/core/src/commands/config/cli";
import { configManager } from "@packages/core/src/common/config";
import execa from "../../../../../__mocks__/execa";

describe("CommandLineInterfaceCommand", () => {
    beforeEach(() => configManager.setup({ configDir: dirSync().name, version: "3.0.0-next.0" }));

    afterAll(() => setGracefulCleanup());

    it("should change the token", async () => {
        await CommandLineInterfaceCommand.run(["--token=ark"]);

        expect(configManager.get("token")).toBe("ark");

        await CommandLineInterfaceCommand.run(["--token=btc"]);

        expect(configManager.get("token")).toBe("btc");
    });

    it("should change the channel and install the new version", async () => {
        const sync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
            stdout: "stdout",
            stderr: undefined,
        });

        await CommandLineInterfaceCommand.run(["--token=ark", "--channel=latest"]);

        expect(configManager.get("channel")).toBe("latest");

        await CommandLineInterfaceCommand.run(["--token=ark", "--channel=next"]);

        expect(configManager.get("channel")).toBe("next");

        await CommandLineInterfaceCommand.run(["--token=ark", "--channel=latest"]);

        expect(configManager.get("channel")).toBe("latest");

        expect(sync).toHaveBeenCalledWith("yarn global add @arkecosystem/core@latest");
        expect(sync).toHaveBeenCalledWith("yarn global add @arkecosystem/core@next");
        expect(sync).toHaveBeenCalledWith("yarn global add @arkecosystem/core@latest");

        sync.mockReset();
    });

    it("should fail to change the channel if the new and old are the same", async () => {
        const sync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
            stdout: "stdout",
            stderr: undefined,
        });

        await CommandLineInterfaceCommand.run(["--token=ark", "--channel=latest"]);

        await expect(CommandLineInterfaceCommand.run(["--token=ark", "--channel=latest"])).rejects.toThrowError(
            'You are already on the "latest" channel.',
        );

        sync.mockReset();
    });
});
