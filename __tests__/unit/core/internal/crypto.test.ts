import { Crypto } from "@packages/core/src/exceptions";
import { buildBIP38 } from "@packages/core/src/internal/crypto";
import { writeJSONSync } from "fs-extra";
import prompts from "prompts";
import { dirSync, setGracefulCleanup } from "tmp";

beforeEach(() => (process.env.CORE_PATH_CONFIG = dirSync().name));

afterAll(() => setGracefulCleanup());

describe("buildBIP38", () => {
    it("should immediately return if a BIP39 passphrase is present", async () => {
        const { bip38, password } = await buildBIP38({ bip39: "bip39" });

        expect(bip38).toBeUndefined();
        expect(password).toBeUndefined();
    });

    it("should immediately return if a BIP38 and password are present as flags", async () => {
        const { bip38, password } = await buildBIP38({ bip38: "bip38", password: "password" });

        expect(bip38).toBe("bip38");
        expect(password).toBe("password");
    });

    it("should immediately return if a BIP38 and password are present as environmeng variable", async () => {
        process.env.CORE_FORGER_BIP38 = "bip38";
        process.env.CORE_FORGER_PASSWORD = "password";

        const { bip38, password } = await buildBIP38({});

        expect(bip38).toBe("bip38");
        expect(password).toBe("password");

        delete process.env.CORE_FORGER_BIP38;
        delete process.env.CORE_FORGER_PASSWORD;
    });

    it("should throw if the delegate configuration does not exist", async () => {
        await expect(buildBIP38({ token: "ark", network: "mainnet" })).rejects.toThrow(
            new Crypto.MissingConfigFile(process.env.CORE_PATH_CONFIG + "/delegates.json"),
        );
    });

    it("should use the bip38 from the delegate configuration", async () => {
        writeJSONSync(`${process.env.CORE_PATH_CONFIG}/delegates.json`, { bip38: "bip38" });

        prompts.inject(["password", true]);

        const { bip38, password } = await buildBIP38({ token: "ark", network: "mainnet" });

        expect(bip38).toBe("bip38");
        expect(password).toBe("password");
    });

    it("should throw if no bip38 or bip39 is present", async () => {
        writeJSONSync(`${process.env.CORE_PATH_CONFIG}/delegates.json`, { secrets: [] });

        await expect(buildBIP38({ token: "ark", network: "mainnet" })).rejects.toThrow(
            new Crypto.PassphraseNotDetected(),
        );
    });

    it("should throw if no secrets are present", async () => {
        writeJSONSync(`${process.env.CORE_PATH_CONFIG}/delegates.json`, {});

        await expect(buildBIP38({ token: "ark", network: "mainnet" })).rejects.toThrow(
            new Crypto.PassphraseNotDetected(),
        );
    });

    it("should throw if no bip38 password is provided and skipPrompts is true", async () => {
        writeJSONSync(`${process.env.CORE_PATH_CONFIG}/delegates.json`, { bip38: "bip38" });

        await expect(buildBIP38({ token: "ark", network: "mainnet", skipPrompts: true })).rejects.toThrow(
            new Crypto.InvalidPassword(),
        );
    });

    it("should throw if no bip38 password is provided", async () => {
        writeJSONSync(`${process.env.CORE_PATH_CONFIG}/delegates.json`, { bip38: "bip38" });

        prompts.inject([null, true]);

        await expect(buildBIP38({ token: "ark", network: "mainnet" })).rejects.toThrow(new Crypto.InvalidPassword());
    });

    it("should throw if no confirmation is provided", async () => {
        writeJSONSync(`${process.env.CORE_PATH_CONFIG}/delegates.json`, { bip38: "bip38" });

        prompts.inject(["password", false]);

        await expect(buildBIP38({ token: "ark", network: "mainnet" })).rejects.toThrow(
            "You'll need to confirm the password to continue.",
        );
    });
});
