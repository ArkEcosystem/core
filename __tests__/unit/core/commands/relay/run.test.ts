import { RunCommand } from "@packages/core/src/commands/relay/run";
import { app } from "@arkecosystem/core-kernel";

describe("RunCommand", () => {
    it("should throw if the process does not exist", async () => {
        const spyBootstrap = jest.spyOn(app, "bootstrap").mockImplementation(undefined);
        const spyBoot = jest.spyOn(app, "boot").mockImplementation(undefined);

        await RunCommand.run(["--token=ark", "--network=testnet"]);

        expect(spyBootstrap).toHaveBeenCalled();
        expect(spyBoot).toHaveBeenCalled();
    });
});
