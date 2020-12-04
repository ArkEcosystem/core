import { Console } from "@arkecosystem/core-test-framework";
import { DiscoverConfig } from "@packages/core-cli/src/commands";
import { ensureDirSync, writeJSON } from "fs-extra";
import { join } from "path";
import { dirSync, setGracefulCleanup } from "tmp";

let cli;
let cmd;
let configPath;
const config = { token: "token", network: "testnet" };

jest.mock("env-paths", () => () => ({
    config: configPath,
}));

beforeAll(() => setGracefulCleanup());

beforeEach(() => {
    cli = new Console();

    cmd = cli.app.resolve(DiscoverConfig);

    configPath = join(dirSync().name, "token-core");
});

describe("DiscoverConfig", () => {
    it("should return undefined if configuration can't be found", async () => {
        await expect(cmd.discover()).resolves.toEqual(undefined);
    });

    it("should return configuration if found on default config location", async () => {
        ensureDirSync(join(configPath, "testnet"));

        await writeJSON(join(configPath, "testnet", "config.json"), config);

        await expect(cmd.discover("token", "testnet")).resolves.toEqual(config);
    });

    it("should return configuration if found on CORE_PATH_CONFIG location", async () => {
        process.env.CORE_PATH_CONFIG = join(configPath, "testnet");

        ensureDirSync(join(configPath, "testnet"));

        await writeJSON(join(configPath, "testnet", "config.json"), config);

        await expect(cmd.discover()).resolves.toEqual(config);

        delete process.env.CORE_PATH_CONFIG;
    });
});
