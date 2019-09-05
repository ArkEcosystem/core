import { dirSync, setGracefulCleanup } from "tmp";

import { GetCommand } from "@packages/core/src/commands/env/get";
import { ensureFileSync, writeFileSync, ensureDirSync } from "fs-extra";

afterAll(() => setGracefulCleanup());

describe("GetCommand", () => {
    it("should get the value of an environment variable", async () => {
        process.env.CORE_PATH_CONFIG = dirSync().name;

        writeFileSync(`${process.env.CORE_PATH_CONFIG}/.env`, "CORE_LOG_LEVEL=emergency");

        let message: string;
        jest.spyOn(console, "log").mockImplementationOnce(m => (message = m));

        await GetCommand.run(["--token=ark", "CORE_LOG_LEVEL"]);

        expect(message).toBe("emergency");
    });

    it("should fail to get the value of a non-existent environment variable", async () => {
        process.env.CORE_PATH_CONFIG = dirSync().name;

        ensureFileSync(`${process.env.CORE_PATH_CONFIG}/.env`);

        await expect(GetCommand.run(["--token=ark", "FAKE_KEY"])).rejects.toThrow('The "FAKE_KEY" doesn\'t exist.');
    });

    it("should fail if the environment configuration doesn't exist", async () => {
        process.env.CORE_PATH_CONFIG = dirSync().name;

        ensureDirSync(`${process.env.CORE_PATH_CONFIG}/jestnet`);

        await expect(GetCommand.run(["--token=btc", "FAKE_KEY"])).rejects.toThrow(
            `No environment file found at ${process.env.CORE_PATH_CONFIG}/.env`,
        );
    });
});
