import { Console } from "@arkecosystem/core-test-framework";
import { Command } from "@packages/core/src/commands/env-get";
import { ensureDirSync, ensureFileSync, writeFileSync } from "fs-extra";
import { dirSync, setGracefulCleanup } from "tmp";

let cli;
beforeEach(() => {
    process.env.CORE_PATH_CONFIG = dirSync().name;

    cli = new Console();
});

afterAll(() => setGracefulCleanup());

describe("GetCommand", () => {
    it("should get the value of an environment variable", async () => {
        writeFileSync(`${process.env.CORE_PATH_CONFIG}/.env`, "CORE_LOG_LEVEL=emergency");

        let message: string;
        jest.spyOn(console, "log").mockImplementationOnce((m) => (message = m));

        await cli.withFlags({ key: "CORE_LOG_LEVEL" }).execute(Command);

        expect(message).toBe("emergency");
    });

    it("should fail to get the value of a non-existent environment variable", async () => {
        ensureFileSync(`${process.env.CORE_PATH_CONFIG}/.env`);

        await expect(cli.withFlags({ key: "FAKE_KEY" }).execute(Command)).rejects.toThrow(
            'The "FAKE_KEY" doesn\'t exist.',
        );
    });

    it("should fail if the environment configuration doesn't exist", async () => {
        ensureDirSync(`${process.env.CORE_PATH_CONFIG}/jestnet`);

        await expect(cli.withFlags({ key: "FAKE_KEY" }).execute(Command)).rejects.toThrow(
            `No environment file found at ${process.env.CORE_PATH_CONFIG}/.env`,
        );
    });
});
