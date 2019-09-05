import { dirSync, setGracefulCleanup } from "tmp";
import { ListCommand } from "@packages/core/src/commands/env/list";
import { removeSync, writeFileSync } from "fs-extra";

afterAll(() => setGracefulCleanup());

describe("ListCommand", () => {
    it("should fail if the environment configuration doesn't exist", async () => {
        process.env.CORE_PATH_CONFIG = dirSync().name;

        let message: string;
        jest.spyOn(console, "error").mockImplementationOnce(m => (message = m));

        await ListCommand.run(["--token=ark", "--network=mainnet"]);

        expect(message).toContain(`No environment file found`);
    });

    it("should list all environment variables", async () => {
        let message: string;
        jest.spyOn(console, "log").mockImplementationOnce(m => (message = m));

        process.env.CORE_PATH_CONFIG = dirSync().name;

        const envFile: string = `${process.env.CORE_PATH_CONFIG}/.env`;

        removeSync(envFile);
        writeFileSync(envFile, "someKey=someValue", { flag: "w" });

        await ListCommand.run(["--token=ark", "--network=mainnet"]);

        expect(message).toContain("Key");
        expect(message).toContain("Value");
        expect(message).toContain("someKey");
        expect(message).toContain("someValue");
    });
});
