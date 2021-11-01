import { Container } from "@arkecosystem/core-cli";
import { Console } from "@arkecosystem/core-test-framework";
import { Command } from "@packages/core/src/commands/config-forger-bip38";
import { writeJSONSync } from "fs-extra";
import prompts from "prompts";
import { dirSync, setGracefulCleanup } from "tmp";

const bip39: string = "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire";
const bip39Flags: string = "venue below waste gather spin cruise title still boost mother flash tuna";
const bip39Prompt: string = "craft imitate step mixture patch forest volcano business charge around girl confirm";
const password: string = "password";

let cli;
beforeAll(() => setGracefulCleanup());

beforeEach(() => {
    process.env.CORE_PATH_CONFIG = dirSync().name;

    writeJSONSync(`${process.env.CORE_PATH_CONFIG}/delegates.json`, {});

    cli = new Console();
});

afterEach(() => jest.resetAllMocks());

describe("BIP38Command", () => {
    it("should configure from flags", async () => {
        await cli.withFlags({ bip39: bip39Flags, password }).execute(Command);

        expect(require(`${process.env.CORE_PATH_CONFIG}/delegates.json`)).toEqual({
            bip38: "6PYSTpJLxqjj8CFJSY5LSPVeyB52U9dqqZCL7DBJe7n5LUWZZfUJktGy31",
            secrets: [],
        });
    });

    it("should configure from a prompt if it receives a valid bip39, password and confirmation", async () => {
        prompts.inject([bip39Prompt, password, true]);

        await cli.execute(Command);

        expect(require(`${process.env.CORE_PATH_CONFIG}/delegates.json`)).toEqual({
            bip38: "6PYVDkKQRjbiWGHwwkXL4dpfCx2AuvCnjqyoMQs83NVNJ27MGUKqYMoMGG",
            secrets: [],
        });
    });

    it("should fail to configure from a prompt if it receives an invalid bip39", async () => {
        await cli.withFlags({ bip39, password }).execute(Command);

        expect(require(`${process.env.CORE_PATH_CONFIG}/delegates.json`)).toEqual({
            bip38: "6PYTQC4c3Te5FCbnU5Z59uZCav121nypLmxanYn21ZoNTdc81eB9wTqeTe",
            secrets: [],
        });

        jest.spyOn(cli.app.get(Container.Identifiers.Prompt), "render").mockReturnValueOnce({
            // @ts-ignore
            bip39: "random-string",
            password,
            passwordConfirmation: password,
        });

        await expect(cli.execute(Command)).rejects.toThrow("Failed to verify the given passphrase as BIP39 compliant.");
    });

    it("should configure from a prompt if it receives an invalid bip39 amd skipValidation flag is set", async () => {
        await cli.withFlags({ bip39, password, skipValidation: true }).execute(Command);

        expect(require(`${process.env.CORE_PATH_CONFIG}/delegates.json`)).toEqual({
            bip38: "6PYTQC4c3Te5FCbnU5Z59uZCav121nypLmxanYn21ZoNTdc81eB9wTqeTe",
            secrets: [],
        });

        jest.spyOn(cli.app.get(Container.Identifiers.Prompt), "render").mockReturnValueOnce({
            // @ts-ignore
            bip39: "random-string",
            password,
            passwordConfirmation: password,
        });

        await expect(cli.execute(Command)).rejects.toThrow("Failed to verify the given passphrase as BIP39 compliant.");
    });

    it("should fail to configure from a prompt if it doesn't receive a bip39", async () => {
        jest.spyOn(cli.app.get(Container.Identifiers.Prompt), "render").mockReturnValue({
            // @ts-ignore
            bip39: null,
            password,
            passwordConfirmation: password,
        });

        await expect(cli.execute(Command)).rejects.toThrow("Failed to verify the given passphrase as BIP39 compliant.");
    });

    it("should fail to configure from a prompt if it doesn't receive a password", async () => {
        jest.spyOn(cli.app.get(Container.Identifiers.Prompt), "render").mockReturnValue({
            // @ts-ignore
            bip39,
            password: null,
            confirm: true,
        });

        await expect(cli.execute(Command)).rejects.toThrow("The BIP38 password has to be a string.");
    });

    it("should fail to configure from a prompt if it doesn't receive a valid bip39", async () => {
        await expect(cli.withFlags({ bip39: "random-string", password: "test" }).execute(Command)).rejects.toThrow(
            "Failed to verify the given passphrase as BIP39 compliant.",
        );
    });
});
