import { RunCommand } from "@packages/core/src/commands/forger/run";
import { dirSync, setGracefulCleanup } from "tmp";
import { writeJSONSync } from "fs-extra";

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

afterAll(() => setGracefulCleanup());

describe("RunCommand", () => {
    it("should throw if the process does not exist", async () => {
        process.env.CORE_PATH_CONFIG = dirSync().name;

        writeJSONSync(`${process.env.CORE_PATH_CONFIG}/delegates.json`, { secrets: ["bip39"] });

        const spyBootstrap = jest.spyOn(app, "bootstrap").mockImplementation(undefined);
        const spyBoot = jest.spyOn(app, "boot").mockImplementation(undefined);

        await RunCommand.run(["--token=ark", "--network=testnet"]);

        expect(spyBootstrap).toHaveBeenCalled();
        expect(spyBoot).toHaveBeenCalled();
    });
});
