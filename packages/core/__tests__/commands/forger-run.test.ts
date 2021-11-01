import { Command } from "@packages/core/src/commands/forger-run";
import { writeJSONSync } from "fs-extra";
import { dirSync, setGracefulCleanup } from "tmp";

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
    setGracefulCleanup();

    process.env.CORE_PATH_CONFIG = dirSync().name;

    writeJSONSync(`${process.env.CORE_PATH_CONFIG}/delegates.json`, { secrets: ["bip39"] });
});

// something funky is going on here which results in the core-test-framework
// CLI helper being unable to be used because the core-kernel mock causes problems
describe("RunCommand", () => {
    it("should throw if the process does not exist", async () => {
        const spyBootstrap = jest.spyOn(app, "bootstrap").mockImplementation(undefined);
        const spyBoot = jest.spyOn(app, "boot").mockImplementation(undefined);

        executeCommand(Command);

        await new Promise<void>((resolve) => {
            setTimeout(() => {
                resolve();
            }, 200);
        });

        expect(spyBootstrap).toHaveBeenCalled();
        expect(spyBoot).toHaveBeenCalled();
    });
});
