import { Container } from "@packages/core-cli";
import { Console } from "@packages/core-test-framework";
import { Command } from "@packages/core/src/commands/config-forger";
import { writeJSONSync } from "fs-extra";
import prompts from "prompts";
import { dirSync, setGracefulCleanup } from "tmp";

const password: string = "password";
const bip39: string = "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire";
const bip39Flags: string = "venue below waste gather spin cruise title still boost mother flash tuna";
const bip39Prompt: string = "craft imitate step mixture patch forest volcano business charge around girl confirm";

let cli;
beforeEach(() => {
    process.env.CORE_PATH_CONFIG = dirSync().name;

    writeJSONSync(`${process.env.CORE_PATH_CONFIG}/delegates.json`, {});

    cli = new Console();
});

afterEach(() => {
    setGracefulCleanup();
    jest.clearAllMocks();
});

describe("ForgerCommand", () => {
    it("should throw if no method is set", async () => {
        jest.spyOn(cli.app.get(Container.Identifiers.Prompt), "render").mockReturnValue({
            // @ts-ignore
            notMethod: "incorrect key",
        });

        await expect(cli.withFlags({ bip39: bip39Flags }).execute(Command)).rejects.toThrow(
            "Please enter valid data and try again!",
        );
    });

    it("should do nothing if the method is netierr bip39 or bip 38", async () => {
        jest.spyOn(cli.app.get(Container.Identifiers.Prompt), "render").mockReturnValue({
            // @ts-ignore
            method: "neither bip 38 or bip 39",
        });

        await expect(cli.withFlags({ bip39: bip39Flags }).execute(Command)).toResolve();
    });

    it("should configure from flags", async () => {
        jest.spyOn(cli.app.get(Container.Identifiers.Prompt), "render").mockReturnValue({
            // @ts-ignore
            method: "neither bip 38 or bip 39",
        });

        await expect(cli.withFlags({ bip39: bip39Flags }).execute(Command)).toResolve();
    });

    it("should configure bip38 from flags", async () => {
        jest.spyOn(cli.app.get(Container.Identifiers.Prompt), "render").mockReturnValue({
            // @ts-ignore
            bip39: bip39Prompt,
            password,
            confirm: true,
        });

        await expect(cli.withFlags({ method: "bip38", bip39: bip39Flags }).execute(Command)).toResolve();
    });

    it("should configure bip39 from flags", async () => {
        jest.spyOn(cli.app.get(Container.Identifiers.Prompt), "render").mockReturnValue({
            // @ts-ignore
            bip39: bip39Prompt,
            confirm: true,
        });
        await expect(cli.withFlags({ method: "bip39", bip39: bip39Flags }).execute(Command)).toResolve();
    });

    describe("BIP39Command", () => {
        beforeEach(() => {
            prompts.inject(["bip39"]);
        });

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

            prompts.inject(["bip39", bip39Prompt, false]);

            await cli.execute(Command);

            expect(require(`${process.env.CORE_PATH_CONFIG}/delegates.json`)).toEqual({ secrets: [bip39] });
        });

        it("should fail to configure from a prompt if it receives an invalid bip39", async () => {
            await cli.withFlags({ bip39 }).execute(Command);

            prompts.inject(["bip39", "random-string", true]);

            await expect(cli.execute(Command)).rejects.toThrow(
                "Failed to verify the given passphrase as BIP39 compliant.",
            );

            expect(require(`${process.env.CORE_PATH_CONFIG}/delegates.json`)).toEqual({ secrets: [bip39] });
        });
    });

    describe("BIP38Command", () => {
        beforeEach(() => {
            prompts.inject(["bip38"]);
        });

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

            jest.spyOn(cli.app.get(Container.Identifiers.Prompt), "render").mockReturnValue({
                // @ts-ignore
                method: "bip38",
                bip39: "random-string",
                password,
                confirm: true,
            });

            await expect(cli.execute(Command)).rejects.toThrow(
                "Failed to verify the given passphrase as BIP39 compliant.",
            );
        });

        it("should fail to configure from a prompt if it doesn't receive a bip39", async () => {
            jest.spyOn(cli.app.get(Container.Identifiers.Prompt), "render").mockReturnValue({
                // @ts-ignore
                method: "bip38",
                bip39: null,
                password,
                confirm: true,
            });

            await expect(cli.execute(Command)).rejects.toThrow(
                "Failed to verify the given passphrase as BIP39 compliant.",
            );
        });

        it("should fail to configure from a prompt if it doesn't receive a password", async () => {
            jest.spyOn(cli.app.get(Container.Identifiers.Prompt), "render").mockReturnValue({
                // @ts-ignore
                method: "bip38",
                bip39,
                password: null,
                confirm: true,
            });

            await expect(cli.execute(Command)).rejects.toThrow("The BIP38 password has to be a string.");
        });
    });
});
