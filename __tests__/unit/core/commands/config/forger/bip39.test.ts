import prompts from "prompts";
import { dirSync, setGracefulCleanup } from "tmp";

import { BIP39Command } from "@packages/core/src/commands/config/forger/bip39";
import { configManager } from "@packages/core/src/common/config";
import { writeJSONSync } from "fs-extra";

const bip39: string = "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire";
const bip39Flags: string = "venue below waste gather spin cruise title still boost mother flash tuna";
const bip39Prompt: string = "craft imitate step mixture patch forest volcano business charge around girl confirm";

describe("BIP39Command", () => {
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
        await BIP39Command.run(["--token=ark", "--network=testnet", `--bip39=${bip39Flags}`]);

        expect(require(`${process.env.CORE_PATH_CONFIG}/delegates.json`)).toEqual({ secrets: [bip39Flags] });
    });

    it("should configure from a prompt if it receives a valid bip39 and confirmation", async () => {
        prompts.inject([bip39Prompt, true]);

        await BIP39Command.run(["--token=ark", "--network=testnet"]);

        expect(require(`${process.env.CORE_PATH_CONFIG}/delegates.json`)).toEqual({ secrets: [bip39Prompt] });
    });

    it("should fail to configure from a prompt if it receives a valid bip39 and but no confirmation", async () => {
        await BIP39Command.run(["--token=ark", "--network=testnet", `--bip39=${bip39}`]);

        prompts.inject([bip39Prompt, false]);

        await BIP39Command.run(["--token=ark", "--network=testnet"]);

        expect(require(`${process.env.CORE_PATH_CONFIG}/delegates.json`)).toEqual({ secrets: [bip39] });
    });

    it("should fail to configure from a prompt if it receives an invalid bip39", async () => {
        await BIP39Command.run(["--token=ark", "--network=testnet", `--bip39=${bip39}`]);

        prompts.inject(["random-string", true]);

        await expect(BIP39Command.run(["--token=ark", "--network=testnet"])).rejects.toThrow(
            "Failed to verify the given passphrase as BIP39 compliant.",
        );

        expect(require(`${process.env.CORE_PATH_CONFIG}/delegates.json`)).toEqual({ secrets: [bip39] });
    });

    it("should fail to configure from a prompt if it doesn't receive a bip39", async () => {
        prompts.inject([null]);

        await expect(BIP39Command.run(["--token=ark", "--network=testnet"])).rejects.toThrow(
            "Failed to verify the given passphrase as BIP39 compliant.",
        );
    });
});
