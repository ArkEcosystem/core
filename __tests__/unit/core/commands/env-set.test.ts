import { Console } from "@arkecosystem/core-test-framework";
import { Command } from "@packages/core/src/commands/env-set";
import envfile from "envfile";
import { ensureFileSync, removeSync } from "fs-extra";
import { dirSync, setGracefulCleanup } from "tmp";

let cli;
beforeAll(() => setGracefulCleanup());

beforeEach(() => {
    process.env.CORE_PATH_CONFIG = dirSync().name;

    cli = new Console();
});

describe("SetCommand", () => {
    it("should set the value of an environment variable", async () => {
        const envFile: string = `${process.env.CORE_PATH_CONFIG}/.env`;

        removeSync(envFile);
        ensureFileSync(envFile);

        await cli.withFlags({ key: "key1", value: "value" }).execute(Command);

        expect(envfile.parseFileSync(envFile)).toEqual({ key1: "value" });

        await cli.withFlags({ key: "key2", value: "value" }).execute(Command);

        expect(envfile.parseFileSync(envFile)).toEqual({ key1: "value", key2: "value" });
    });
});
