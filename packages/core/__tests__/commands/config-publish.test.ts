import { Container } from "@arkecosystem/core-cli";
import { Console } from "@arkecosystem/core-test-framework";
import { Command } from "@packages/core/src/commands/config-publish";
import fs from "fs-extra";
import { dirSync, setGracefulCleanup } from "tmp";

// jest.mock("fs-extra");

let cli;
beforeEach(() => {
    process.env.CORE_PATH_CONFIG = dirSync().name;

    cli = new Console();
});

afterEach(() => jest.resetAllMocks());

afterAll(() => setGracefulCleanup());

describe("PublishCommand", () => {
    it("should throw if the network is invalid", async () => {
        await expect(cli.withFlags({ network: "invalid" }).execute(Command)).rejects.toThrow(
            '"network" must be one of [devnet, mainnet, testnet]',
        );
    });

    it("should throw if the destination already exists", async () => {
        jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);

        await expect(cli.execute(Command)).rejects.toThrow(
            "Please use the --reset flag if you wish to reset your configuration.",
        );
    });

    it("should throw if the configuration files cannot be found", async () => {
        jest.spyOn(fs, "existsSync").mockReturnValueOnce(false).mockReturnValueOnce(false);

        await expect(cli.execute(Command)).rejects.toThrow("Couldn't find the core configuration files");
    });

    it("should throw if the environment file cannot be found", async () => {
        jest.spyOn(fs, "existsSync").mockReturnValueOnce(false).mockReturnValueOnce(true).mockReturnValueOnce(false);

        const spyEnsure = jest.spyOn(fs, "ensureDirSync");

        await expect(cli.execute(Command)).rejects.toThrow("Couldn't find the environment file");

        expect(spyEnsure).toHaveBeenCalled();
    });

    it("should publish the configuration", async () => {
        jest.spyOn(fs, "existsSync").mockReturnValueOnce(false).mockReturnValueOnce(true).mockReturnValueOnce(true);

        const spyEnsure = jest.spyOn(fs, "ensureDirSync");
        const spyCopy = jest.spyOn(fs, "copySync");

        await cli.execute(Command);

        expect(spyEnsure).toHaveBeenCalled();
        expect(spyCopy).toHaveBeenCalledTimes(2);
    });

    it("should reset the configuration", async () => {
        jest.spyOn(fs, "existsSync").mockReturnValueOnce(false).mockReturnValueOnce(true).mockReturnValueOnce(true);

        const spyRemove = jest.spyOn(fs, "removeSync");
        const spyEnsure = jest.spyOn(fs, "ensureDirSync");
        const spyCopy = jest.spyOn(fs, "copySync");

        await cli.withFlags({ reset: true }).execute(Command);

        expect(spyRemove).toHaveBeenCalled();
        expect(spyEnsure).toHaveBeenCalled();
        expect(spyCopy).toHaveBeenCalledTimes(2);
    });

    it("should publish the configuration via prompt", async () => {
        jest.spyOn(fs, "existsSync").mockReturnValueOnce(false).mockReturnValueOnce(true).mockReturnValueOnce(true);

        const spyEnsure = jest.spyOn(fs, "ensureDirSync");
        const spyCopy = jest.spyOn(fs, "copySync");

        jest.spyOn(cli.app.get(Container.Identifiers.Prompt), "render").mockReturnValue({
            // @ts-ignore
            network: "mainnet",
            confirm: true,
        });

        await cli.execute(Command);

        expect(spyEnsure).toHaveBeenCalled();
        expect(spyCopy).toHaveBeenCalledTimes(2);
    });

    it("should throw if no network is selected via prompt", async () => {
        jest.spyOn(fs, "existsSync").mockReturnValueOnce(false).mockReturnValueOnce(true).mockReturnValueOnce(true);

        const spyEnsure = jest.spyOn(fs, "ensureDirSync");
        const spyCopy = jest.spyOn(fs, "copySync");

        jest.spyOn(cli.app.get(Container.Identifiers.Prompt), "render").mockReturnValue({
            // @ts-ignore
            network: undefined,
            confirm: true,
        });

        await expect(cli.withFlags({ network: undefined }).execute(Command)).rejects.toThrow(
            "You'll need to select the network to continue.",
        );

        expect(spyEnsure).not.toHaveBeenCalled();
        expect(spyCopy).not.toHaveBeenCalled();
    });

    it("should throw if the selected network is invalid via prompt", async () => {
        jest.spyOn(fs, "existsSync").mockReturnValueOnce(false).mockReturnValueOnce(true).mockReturnValueOnce(true);

        const spyEnsure = jest.spyOn(fs, "ensureDirSync");
        const spyCopy = jest.spyOn(fs, "copySync");

        jest.spyOn(cli.app.get(Container.Identifiers.Prompt), "render").mockReturnValue({
            // @ts-ignore
            network: "mainnet",
            confirm: false,
        });

        await expect(cli.withFlags({ network: undefined }).execute(Command)).rejects.toThrow(
            "You'll need to confirm the network to continue.",
        );

        expect(spyEnsure).not.toHaveBeenCalled();
        expect(spyCopy).not.toHaveBeenCalled();
    });

    it("should publish the configuration via prompt without flag set before", async () => {
        jest.spyOn(fs, "existsSync").mockReturnValueOnce(false).mockReturnValueOnce(true).mockReturnValueOnce(true);

        const spyEnsure = jest.spyOn(fs, "ensureDirSync");
        const spyCopy = jest.spyOn(fs, "copySync");

        jest.spyOn(cli.app.get(Container.Identifiers.Prompt), "render").mockReturnValue({
            // @ts-ignore
            network: "mainnet",
            confirm: true,
        });

        await cli.withFlags({ network: undefined }).execute(Command);

        expect(spyEnsure).toHaveBeenCalled();
        expect(spyCopy).toHaveBeenCalledTimes(2);
    });
});
