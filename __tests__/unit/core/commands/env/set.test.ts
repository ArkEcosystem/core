import { dirSync, setGracefulCleanup } from "tmp";
import envfile from "envfile";

import { SetCommand } from "@packages/core/src/commands/env/set";
import { ensureFileSync, removeSync } from "fs-extra";

afterAll(() => setGracefulCleanup());

describe("SetCommand", () => {
    it("should set the value of an environment variable", async () => {
        process.env.CORE_PATH_CONFIG = dirSync().name;

        const envFile: string = `${process.env.CORE_PATH_CONFIG}/.env`;

        removeSync(envFile);
        ensureFileSync(envFile);

        await SetCommand.run(["--token=ark", "--network=mainnet", "key1", "value"]);

        expect(envfile.parseFileSync(envFile)).toEqual({ key1: "value" });

        await SetCommand.run(["--token=ark", "--network=mainnet", "key2", "value"]);

        expect(envfile.parseFileSync(envFile)).toEqual({ key1: "value", key2: "value" });
    });
});
