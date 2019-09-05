import { dirSync, setGracefulCleanup } from "tmp";

import { parseWithNetwork } from "@packages/core/src/common/parser";
import { configManager } from "@packages/core/src/common/config";
import { getPaths } from "@packages/core/src/common/env";
import { ensureDirSync } from "fs-extra";
import prompts from "prompts";

beforeEach(() => {
    configManager.setup({ configDir: dirSync().name, version: "3.0.0", bin: "ark" });
});

afterAll(() => setGracefulCleanup());

describe("parseWithNetwork", () => {
    it("should use the configured token if none is specified via flag", async () => {
        configManager.set("token", "random");

        const { args, flags, paths } = await parseWithNetwork({
            args: [],
            flags: { network: "mainnet" },
        });

        expect(args).toEqual([]);
        expect(flags).toEqual({ network: "mainnet", token: "random" });
        expect(paths.cache).toEqual(getPaths("random", "mainnet").cache);
        expect(paths.config).toEqual(getPaths("random", "mainnet").config);
        expect(paths.data).toEqual(getPaths("random", "mainnet").data);
        expect(paths.log).toEqual(getPaths("random", "mainnet").log);
        expect(paths.temp).toEqual(getPaths("random", "mainnet").temp);
    });

    it("should use the given token via flags", async () => {
        const { args, flags, paths } = await parseWithNetwork({
            args: [],
            flags: { token: "ark", network: "mainnet" },
        });

        expect(args).toEqual([]);
        expect(flags).toEqual({ network: "mainnet", token: "ark" });
        expect(paths.cache).toEqual(getPaths("ark", "mainnet").cache);
        expect(paths.config).toEqual(getPaths("ark", "mainnet").config);
        expect(paths.data).toEqual(getPaths("ark", "mainnet").data);
        expect(paths.log).toEqual(getPaths("ark", "mainnet").log);
        expect(paths.temp).toEqual(getPaths("ark", "mainnet").temp);
    });

    it("should throw if the given configuration does not exist", async () => {
        process.env.CORE_PATH_CONFIG = "does-not-exist";

        await expect(
            parseWithNetwork({
                args: [],
                flags: { token: "ark" },
            }),
        ).rejects.toThrow(`The given config "${process.env.CORE_PATH_CONFIG}" does not exist.`);

        delete process.env.CORE_PATH_CONFIG;
    });

    it("should throw if no configurations can be detected", async () => {
        process.env.CORE_PATH_CONFIG = dirSync().name;

        await expect(
            parseWithNetwork({
                args: [],
                flags: { token: "ark" },
            }),
        ).rejects.toThrow('We were unable to detect any configuration. Please run "ark config:publish" and try again.');

        delete process.env.CORE_PATH_CONFIG;
    });

    it("should choose the first network if only a single network is found", async () => {
        process.env.CORE_PATH_CONFIG = dirSync().name;

        ensureDirSync(`${process.env.CORE_PATH_CONFIG}/mainnet`);

        const { flags } = await parseWithNetwork({
            args: [],
            flags: { token: "ark" },
        });

        expect(flags).toEqual({ network: "mainnet", token: "ark" });

        delete process.env.CORE_PATH_CONFIG;
    });

    it("should choose the selected network if multiple networks are found", async () => {
        process.env.CORE_PATH_CONFIG = dirSync().name;

        ensureDirSync(`${process.env.CORE_PATH_CONFIG}/mainnet`);
        ensureDirSync(`${process.env.CORE_PATH_CONFIG}/devnet`);

        prompts.inject(["devnet", true]);

        const { flags } = await parseWithNetwork({
            args: [],
            flags: { token: "ark" },
        });

        expect(flags).toEqual({ network: "devnet", token: "ark" });

        delete process.env.CORE_PATH_CONFIG;
    });

    it("should throw if the network selection is not confirmed", async () => {
        process.env.CORE_PATH_CONFIG = dirSync().name;

        ensureDirSync(`${process.env.CORE_PATH_CONFIG}/mainnet`);
        ensureDirSync(`${process.env.CORE_PATH_CONFIG}/devnet`);

        prompts.inject(["devnet", false]);

        await expect(
            parseWithNetwork({
                args: [],
                flags: { token: "ark" },
            }),
        ).rejects.toThrow("You'll need to confirm the network to continue.");

        delete process.env.CORE_PATH_CONFIG;
    });

    it("should throw if the network selection is not valid", async () => {
        process.env.CORE_PATH_CONFIG = dirSync().name;

        ensureDirSync(`${process.env.CORE_PATH_CONFIG}/mainnet`);
        ensureDirSync(`${process.env.CORE_PATH_CONFIG}/devnet`);

        prompts.inject(["randomnet", true]);

        await expect(
            parseWithNetwork({
                args: [],
                flags: { token: "ark" },
            }),
        ).rejects.toThrow(`The given network "randomnet" is not valid.`);

        delete process.env.CORE_PATH_CONFIG;
    });
});
