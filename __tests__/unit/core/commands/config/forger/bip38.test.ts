import prompts from "prompts";
import { dirSync, setGracefulCleanup } from "tmp";

import { BIP38Command } from "@packages/core/src/commands/config/forger/bip38";
import { configManager } from "@packages/core/src/common/config-manager";
import { writeJSONSync } from "fs-extra";

const bip39: string = "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire";
const bip39Flags: string = "venue below waste gather spin cruise title still boost mother flash tuna";
const bip39Prompt: string = "craft imitate step mixture patch forest volcano business charge around girl confirm";
const password: string = "password";

describe("BIP38Command", () => {
    beforeEach(() => {
        process.env.CORE_PATH_CONFIG = dirSync().name;

        writeJSONSync(`${process.env.CORE_PATH_CONFIG}/delegates.json`, {});

        configManager.setup({
            configDir: process.env.CORE_PATH_CONFIG,
            version: "3.0.0-next.0",
        });
    });

    afterAll(() => setGracefulCleanup());

    it("should configure from flags", async () => {
        await BIP38Command.run(["--token=ark", "--network=testnet", `--bip39=${bip39Flags}`, `--password=${password}`]);

        expect(require(`${process.env.CORE_PATH_CONFIG}/delegates.json`)).toEqual({
            bip38: "6PYSTpJLxqjj8CFJSY5LSPVeyB52U9dqqZCL7DBJe7n5LUWZZfUJktGy31",
            secrets: [],
        });
    });

    it("should configure from a prompt if it receives a valid bip39, password and confirmation", async () => {
        prompts.inject([bip39Prompt, password, true]);

        await BIP38Command.run(["--token=ark", "--network=testnet"]);

        expect(require(`${process.env.CORE_PATH_CONFIG}/delegates.json`)).toEqual({
            bip38: "6PYVDkKQRjbiWGHwwkXL4dpfCx2AuvCnjqyoMQs83NVNJ27MGUKqYMoMGG",
            secrets: [],
        });
    });

    it("should fail to configure from a prompt if it receives a valid bip39 and password but no confirmation", async () => {
        await BIP38Command.run(["--token=ark", "--network=testnet", `--bip39=${bip39}`, `--password=${password}`]);

        expect(require(`${process.env.CORE_PATH_CONFIG}/delegates.json`)).toEqual({
            bip38: "6PYTQC4c3Te5FCbnU5Z59uZCav121nypLmxanYn21ZoNTdc81eB9wTqeTe",
            secrets: [],
        });

        prompts.inject([bip39Prompt, password, false]);

        await BIP38Command.run(["--token=ark", "--network=testnet"]);

        expect(require(`${process.env.CORE_PATH_CONFIG}/delegates.json`)).toEqual({
            bip38: "6PYTQC4c3Te5FCbnU5Z59uZCav121nypLmxanYn21ZoNTdc81eB9wTqeTe",
            secrets: [],
        });
    });

    it("should fail to configure from a prompt if it receives an invalid bip39", async () => {
        await BIP38Command.run(["--token=ark", "--network=testnet", `--bip39=${bip39}`, `--password=${password}`]);

        expect(require(`${process.env.CORE_PATH_CONFIG}/delegates.json`)).toEqual({
            bip38: "6PYTQC4c3Te5FCbnU5Z59uZCav121nypLmxanYn21ZoNTdc81eB9wTqeTe",
            secrets: [],
        });

        prompts.inject(["random-string", password, true]);

        await expect(BIP38Command.run(["--token=ark", "--network=testnet"])).rejects.toThrow(
            "Failed to verify the given passphrase as BIP39 compliant.",
        );
    });

    it("should fail to configure from a prompt if it doesn't receive a bip39", async () => {
        prompts.inject([null, password, true]);

        await expect(BIP38Command.run(["--token=ark", "--network=testnet"])).rejects.toThrow(
            "Failed to verify the given passphrase as BIP39 compliant.",
        );
    });

    it("should fail to configure from a prompt if it doesn't receive a password", async () => {
        prompts.inject([bip39, null, true]);

        await expect(BIP38Command.run(["--token=ark", "--network=testnet"])).rejects.toThrow(
            "The BIP38 password has to be a string.",
        );
    });
});
