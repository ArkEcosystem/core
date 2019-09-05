import { dirSync, setGracefulCleanup } from "tmp";

import { PublishCommand } from "@packages/core/src/commands/config/publish";
import fs from "fs-extra";
import prompts from "prompts";

jest.mock("fs-extra");

describe("PublishCommand", () => {
    beforeEach(() => (process.env.CORE_PATH_CONFIG = dirSync().name));

    afterAll(() => setGracefulCleanup());

    it("should throw if the network is invalid", async () => {
        await expect(PublishCommand.run(["--token=ark", "--network=invalid"])).rejects.toThrow(
            /Expected --network=invalid to be one of: devnet, mainnet, testnet, unitnet/,
        );
    });

    it("should throw if the destination already exists", async () => {
        const spyExists = jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);

        await expect(PublishCommand.run(["--token=ark", "--network=mainnet"])).rejects.toThrow(
            /Please use the --reset flag if you wish to reset your configuration./,
        );

        spyExists.mockClear();
    });

    it("should throw if the configuration files cannot be found", async () => {
        const spyExists = jest
            .spyOn(fs, "existsSync")
            .mockReturnValueOnce(false)
            .mockReturnValueOnce(false);

        await expect(PublishCommand.run(["--token=ark", "--network=mainnet"])).rejects.toThrow(
            /Couldn't find the core configuration files/,
        );

        spyExists.mockClear();
    });

    it("should throw if the environment file cannot be found", async () => {
        const spyExists = jest
            .spyOn(fs, "existsSync")
            .mockReturnValueOnce(false)
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(false);

        const spyEnsure = jest.spyOn(fs, "ensureDirSync");

        await expect(PublishCommand.run(["--token=ark", "--network=mainnet"])).rejects.toThrow(
            /Couldn't find the environment file/,
        );

        expect(spyEnsure).toHaveBeenCalled();

        spyExists.mockClear();
        spyEnsure.mockClear();
    });

    it("should publish the configuration", async () => {
        const spyExists = jest
            .spyOn(fs, "existsSync")
            .mockReturnValueOnce(false)
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true);

        const spyEnsure = jest.spyOn(fs, "ensureDirSync");
        const spyCopy = jest.spyOn(fs, "copySync");

        await PublishCommand.run(["--token=ark", "--network=mainnet"]);

        expect(spyEnsure).toHaveBeenCalled();
        expect(spyCopy).toHaveBeenCalledTimes(2);

        spyExists.mockClear();
        spyEnsure.mockClear();
        spyCopy.mockClear();
    });

    it("should reset the configuration", async () => {
        const spyExists = jest
            .spyOn(fs, "existsSync")
            .mockReturnValueOnce(false)
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true);

        const spyRemove = jest.spyOn(fs, "removeSync");
        const spyEnsure = jest.spyOn(fs, "ensureDirSync");
        const spyCopy = jest.spyOn(fs, "copySync");

        await PublishCommand.run(["--token=ark", "--network=mainnet", "--reset"]);

        expect(spyRemove).toHaveBeenCalled();
        expect(spyEnsure).toHaveBeenCalled();
        expect(spyCopy).toHaveBeenCalledTimes(2);

        spyExists.mockClear();
        spyRemove.mockClear();
        spyEnsure.mockClear();
        spyCopy.mockClear();
    });

    it("should publish the configuration via prompt", async () => {
        const spyExists = jest
            .spyOn(fs, "existsSync")
            .mockReturnValueOnce(false)
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true);

        const spyEnsure = jest.spyOn(fs, "ensureDirSync");
        const spyCopy = jest.spyOn(fs, "copySync");

        prompts.inject(["mainnet", true]);

        await PublishCommand.run(["--token=ark"]);

        expect(spyEnsure).toHaveBeenCalled();
        expect(spyCopy).toHaveBeenCalledTimes(2);

        spyExists.mockClear();
        spyEnsure.mockClear();
        spyCopy.mockClear();
    });

    it("should throw if no network is selected via prompt", async () => {
        const spyExists = jest
            .spyOn(fs, "existsSync")
            .mockReturnValueOnce(false)
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true);

        const spyEnsure = jest.spyOn(fs, "ensureDirSync");
        const spyCopy = jest.spyOn(fs, "copySync");

        prompts.inject([undefined, true]);

        await expect(PublishCommand.run(["--token=ark"])).rejects.toThrow(
            "You'll need to select the network to continue.",
        );

        expect(spyEnsure).not.toHaveBeenCalled();
        expect(spyCopy).not.toHaveBeenCalled();

        spyExists.mockClear();
        spyEnsure.mockClear();
        spyCopy.mockClear();
    });

    it("should throw if the selected network is invalid via prompt", async () => {
        const spyExists = jest
            .spyOn(fs, "existsSync")
            .mockReturnValueOnce(false)
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true);

        const spyEnsure = jest.spyOn(fs, "ensureDirSync");
        const spyCopy = jest.spyOn(fs, "copySync");

        prompts.inject(["mainnet", false]);

        await expect(PublishCommand.run(["--token=ark"])).rejects.toThrow(
            "You'll need to confirm the network to continue.",
        );

        expect(spyEnsure).not.toHaveBeenCalled();
        expect(spyCopy).not.toHaveBeenCalled();

        spyExists.mockClear();
        spyEnsure.mockClear();
        spyCopy.mockClear();
    });
});
