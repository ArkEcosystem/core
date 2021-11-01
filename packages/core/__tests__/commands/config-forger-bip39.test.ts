import { Console } from "@arkecosystem/core-test-framework";
import { Command } from "@packages/core/src/commands/config-forger-bip39";
import { writeJSONSync } from "fs-extra";
import prompts from "prompts";
import { dirSync, setGracefulCleanup } from "tmp";

const bip39: string = "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire";
const bip39Flags: string = "venue below waste gather spin cruise title still boost mother flash tuna";
const bip39Prompt: string = "craft imitate step mixture patch forest volcano business charge around girl confirm";

let cli;
beforeEach(() => {
    process.env.CORE_PATH_CONFIG = dirSync().name;

    writeJSONSync(`${process.env.CORE_PATH_CONFIG}/delegates.json`, {});

    cli = new Console();
});

afterAll(() => setGracefulCleanup());

describe("BIP39Command", () => {
    it("should configure from flags", async () => {
        await cli.withFlags({ bip39: bip39Flags }).execute(Command);

        expect(require(`${process.env.CORE_PATH_CONFIG}/delegates.json`)).toEqual({ secrets: [bip39Flags] });
    });

    it("should configure from a prompt if it receives a valid bip39 and confirmation", async () => {
        prompts.inject([bip39Prompt, true]);

        await cli.execute(Command);

        expect(require(`${process.env.CORE_PATH_CONFIG}/delegates.json`)).toEqual({ secrets: [bip39Prompt] });
    });

    it("should fail to configure from a prompt if it receives a valid bip39 and but no confirmation", async () => {
        await cli.withFlags({ bip39 }).execute(Command);

        prompts.inject([bip39Prompt, false]);

        await cli.execute(Command);

        expect(require(`${process.env.CORE_PATH_CONFIG}/delegates.json`)).toEqual({ secrets: [bip39] });
    });

    it("should fail to configure from a prompt if it receives an invalid bip39", async () => {
        await cli.withFlags({ bip39 }).execute(Command);

        prompts.inject(["random-string", true]);

        await expect(cli.execute(Command)).rejects.toThrow("Failed to verify the given passphrase as BIP39 compliant.");

        expect(require(`${process.env.CORE_PATH_CONFIG}/delegates.json`)).toEqual({ secrets: [bip39] });
    });

    it("should configure from a prompt if it receives an invalid bip39 and skipValidation flag is set", async () => {
        await cli.withFlags({ bip39 }).execute(Command);

        prompts.inject(["random-string", true]);

        await cli.withFlags({ skipValidation: true }).execute(Command);

        expect(require(`${process.env.CORE_PATH_CONFIG}/delegates.json`)).toEqual({ secrets: ["random-string"] });
    });

    it("should fail to configure from a prompt if it doesn't receive a bip39", async () => {
        prompts.inject([null, true]);

        await expect(cli.execute(Command)).rejects.toThrow("Failed to verify the given passphrase as BIP39 compliant.");
    });

    it("should fail to configure from a prompt if it doesn't receive a valid bip39", async () => {
        await expect(cli.withFlags({ bip39: "random-string" }).execute(Command)).rejects.toThrow(
            "Failed to verify the given passphrase as BIP39 compliant.",
        );
    });
});
