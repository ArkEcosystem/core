import { RunCommand } from "@packages/core/src/commands/core/run";
import { app } from "@arkecosystem/core-kernel";
import { dirSync, setGracefulCleanup } from "tmp";
import { writeJSONSync } from "fs-extra";

beforeEach(() => {
    process.env.CORE_PATH_CONFIG = dirSync().name;

    writeJSONSync(`${process.env.CORE_PATH_CONFIG}/delegates.json`, { secrets: ["bip39"] });
});

afterAll(() => setGracefulCleanup());

describe("RunCommand", () => {
    it("should throw if the process does not exist", async () => {
        const spyBootstrap = jest.spyOn(app, "bootstrap").mockImplementation(undefined);
        const spyBoot = jest.spyOn(app, "boot").mockImplementation(undefined);

        await RunCommand.run(["--token=ark", "--network=testnet"]);

        expect(spyBootstrap).toHaveBeenCalled();
        expect(spyBoot).toHaveBeenCalled();
    });
});
