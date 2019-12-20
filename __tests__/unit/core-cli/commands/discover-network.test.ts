import { Console } from "@arkecosystem/core-test-framework";
import envPaths from "env-paths";
import { dirSync, setGracefulCleanup } from "tmp";

import { ensureDirSync } from "fs-extra";
import prompts from "prompts";

import { DiscoverNetwork } from "@packages/core-cli/src/commands";

let cli;
let cmd;
let configPath;

beforeAll(() => setGracefulCleanup());

beforeEach(() => {
    cli = new Console();

    cmd = cli.app.resolve(DiscoverNetwork);

    configPath = envPaths("ark", { suffix: "core" }).config;
});

describe("DiscoverNetwork", () => {
    it("should throw if no configurations can be detected", async () => {
        await expect(cmd.discover(configPath)).rejects.toThrow();

        delete process.env.CORE_PATH_CONFIG;
    });

    it("should throw if no configurations can be detected (with environment variable as path)", async () => {
        process.env.CORE_PATH_CONFIG = dirSync().name;

        await expect(cmd.discover(configPath)).rejects.toThrow();

        delete process.env.CORE_PATH_CONFIG;
    });

    it("should choose the first network if only a single network is found", async () => {
        process.env.CORE_PATH_CONFIG = dirSync().name;

        ensureDirSync(`${process.env.CORE_PATH_CONFIG}/mainnet`);

        await expect(cmd.discover(configPath)).resolves.toBe("mainnet");

        delete process.env.CORE_PATH_CONFIG;
    });

    it("should throw if the given path does not exist", async () => {
        await expect(cmd.discover("does-not-exist")).rejects.toThrow("The [does-not-exist] directory does not exist.");
    });

    it("should choose the selected network if multiple networks are found", async () => {
        process.env.CORE_PATH_CONFIG = dirSync().name;

        ensureDirSync(`${process.env.CORE_PATH_CONFIG}/mainnet`);
        ensureDirSync(`${process.env.CORE_PATH_CONFIG}/devnet`);

        prompts.inject(["devnet", true]);

        await expect(cmd.discover(configPath)).resolves.toBe("devnet");

        delete process.env.CORE_PATH_CONFIG;
    });

    it("should throw if the network selection is not confirmed", async () => {
        process.env.CORE_PATH_CONFIG = dirSync().name;

        ensureDirSync(`${process.env.CORE_PATH_CONFIG}/mainnet`);
        ensureDirSync(`${process.env.CORE_PATH_CONFIG}/devnet`);

        prompts.inject(["devnet", false]);

        await expect(cmd.discover(configPath)).rejects.toThrow("You'll need to confirm the network to continue.");

        delete process.env.CORE_PATH_CONFIG;
    });

    it("should throw if the network selection is not valid", async () => {
        process.env.CORE_PATH_CONFIG = dirSync().name;

        ensureDirSync(`${process.env.CORE_PATH_CONFIG}/mainnet`);
        ensureDirSync(`${process.env.CORE_PATH_CONFIG}/devnet`);

        prompts.inject(["randomnet", true]);

        await expect(cmd.discover(configPath)).rejects.toThrow(`The given network "randomnet" is not valid.`);

        delete process.env.CORE_PATH_CONFIG;
    });
});
