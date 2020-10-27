import { Console } from "@arkecosystem/core-test-framework";
import { Command } from "@packages/core/src/commands/env-list";
import { removeSync, writeFileSync } from "fs-extra";
import { dirSync, setGracefulCleanup } from "tmp";

let cli;
beforeEach(() => {
    process.env.CORE_PATH_CONFIG = dirSync().name;

    cli = new Console();
});

afterAll(() => setGracefulCleanup());

describe("ListCommand", () => {
    it("should fail if the environment configuration doesn't exist", async () => {
        await expect(cli.execute(Command)).rejects.toThrow(
            `No environment file found at ${process.env.CORE_PATH_CONFIG}/.env`,
        );
    });

    it("should list all environment variables", async () => {
        let message: string;
        jest.spyOn(console, "log").mockImplementationOnce((m) => (message = m));

        const envFile: string = `${process.env.CORE_PATH_CONFIG}/.env`;

        removeSync(envFile);
        writeFileSync(envFile, "someKey=someValue", { flag: "w" });

        await cli.execute(Command);

        expect(message).toContain("Key");
        expect(message).toContain("Value");
        expect(message).toContain("someKey");
        expect(message).toContain("someValue");
    });
});
