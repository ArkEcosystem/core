import "jest-extended";

import { Container } from "@arkecosystem/core-cli";
import { Console } from "@arkecosystem/core-test-framework";
import { Updater } from "@packages/core-cli/src/services/updater";
import nock from "nock";
import prompts from "prompts";

import execa from "../../../../__mocks__/execa";
import { versionNext } from "./__fixtures__/latest-version";

let cli;
// let processManager;
let updater;
let config;

beforeEach(() => {
    nock.cleanAll();

    cli = new Console();
    // processManager = cli.app.get(Container.Identifiers.ProcessManager);
    updater = cli.app.resolve(Updater);
    config = cli.app.get(Container.Identifiers.Config);
});

afterEach(() => jest.resetAllMocks());

beforeAll(() => nock.disableNetConnect());

afterAll(() => nock.enableNetConnect());

describe("Updater", () => {
    describe("#check", () => {
        it("should forget the latest version if it has one from a previous check", async () => {
            nock(/.*/).get("/@arkecosystem%2Fcore").reply(200, versionNext);

            config.set("latestVersion", {});

            const spyForget = jest.spyOn(config, "forget");

            await expect(updater.check()).resolves.toBeFalse();
            expect(spyForget).toHaveBeenCalledWith("latestVersion");
        });

        it("should return false if the latest version cannot be retrieved", async () => {
            nock(/.*/).get("/@arkecosystem%2Fcore").reply(200, {});

            const spyWarning = jest.spyOn(cli.app.get(Container.Identifiers.Warning), "render");

            await expect(updater.check()).resolves.toBeFalse();
            expect(spyWarning).toHaveBeenCalledWith('We were unable to find any releases for the "next" channel.');
        });

        it("should return false if the latest version is already installed", async () => {
            nock(/.*/).get("/@arkecosystem%2Fcore").reply(200, versionNext);

            await expect(updater.check()).resolves.toBeFalse();
        });

        it("should return false if the last check has been within the last 24 hours ago", async () => {
            nock(/.*/).get("/@arkecosystem%2Fcore").reply(200, versionNext);

            config.set("lastUpdateCheck", Date.now());

            await expect(updater.check()).resolves.toBeFalse();
        });

        it("should return true if a new version is available", async () => {
            const response = { ...versionNext };
            response["dist-tags"].next = "4.0.0-next.0";
            response.versions["4.0.0-next.0"] = { ...response.versions["2.5.0-next.10"] };
            response.versions["4.0.0-next.0"] = {
                ...response.versions["2.5.0-next.10"],
                ...{ version: "4.0.0-next.0" },
            };

            nock(/.*/).get("/@arkecosystem%2Fcore").reply(200, response);

            config.set("latestVersion", {});

            const spySet = jest.spyOn(config, "set");

            await expect(updater.check()).resolves.toBeTrue();
            expect(spySet).toHaveBeenCalled();
        });
    });

    describe("#update", () => {
        it("should return early if the latest version is not present", async () => {
            await expect(updater.update()).resolves.toBeFalse();
        });

        it("should update without a prompt if a new version is available", async () => {
            // Arrange...
            const response = { ...versionNext };
            response["dist-tags"].next = "4.0.0-next.0";
            response.versions["4.0.0-next.0"] = { ...response.versions["2.5.0-next.10"] };
            response.versions["4.0.0-next.0"] = {
                ...response.versions["2.5.0-next.10"],
                ...{ version: "4.0.0-next.0" },
            };

            nock(/.*/).get("/@arkecosystem%2Fcore").reply(200, response);

            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: '"null"',
                stderr: undefined,
                exitCode: 0,
            });
            const spySpinner = jest.spyOn(cli.app.get(Container.Identifiers.Spinner), "render");
            const spyInstaller = jest.spyOn(cli.app.get(Container.Identifiers.Installer), "install");
            const spyProcessManager = jest.spyOn(cli.app.get(Container.Identifiers.ProcessManager), "update");

            // Act...
            await updater.check();

            const update = await updater.update(true, true);

            // Assert...
            expect(update).toBeTrue();
            expect(spySync).toHaveBeenCalled();
            expect(spySpinner).toHaveBeenCalled();
            expect(spyInstaller).toHaveBeenCalled();
            expect(spyProcessManager).toHaveBeenCalled();
        });

        it("should update with a prompt if a new version is available", async () => {
            // Arrange...
            const response = { ...versionNext };
            response["dist-tags"].next = "4.0.0-next.0";
            response.versions["4.0.0-next.0"] = { ...response.versions["2.5.0-next.10"] };
            response.versions["4.0.0-next.0"] = {
                ...response.versions["2.5.0-next.10"],
                ...{ version: "4.0.0-next.0" },
            };

            nock(/.*/).get("/@arkecosystem%2Fcore").reply(200, response);

            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: '"null"',
                stderr: undefined,
                exitCode: 0,
            });
            const spySpinner = jest.spyOn(cli.app.get(Container.Identifiers.Spinner), "render");
            const spyInstaller = jest.spyOn(cli.app.get(Container.Identifiers.Installer), "install");

            prompts.inject([true]);

            // Act...
            await updater.check();

            const update = await updater.update();

            // Assert...
            expect(update).toBeTrue();
            expect(spySync).toHaveBeenCalled();
            expect(spySpinner).toHaveBeenCalled();
            expect(spyInstaller).toHaveBeenCalled();
        });

        it("should fail to update without a confirmation", async () => {
            // Arrange...
            const response = { ...versionNext };
            response["dist-tags"].next = "4.0.0-next.0";
            response.versions["4.0.0-next.0"] = { ...response.versions["2.5.0-next.10"] };
            response.versions["4.0.0-next.0"] = {
                ...response.versions["2.5.0-next.10"],
                ...{ version: "4.0.0-next.0" },
            };

            nock(/.*/).get("/@arkecosystem%2Fcore").reply(200, response);

            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: '"null"',
                stderr: undefined,
                exitCode: 0,
            });
            const spySpinner = jest.spyOn(cli.app.get(Container.Identifiers.Spinner), "render");
            const spyInstaller = jest.spyOn(cli.app.get(Container.Identifiers.Installer), "install");

            prompts.inject([false]);

            // Act...
            await updater.check();
            await expect(updater.update()).rejects.toThrow("You'll need to confirm the update to continue.");

            // Assert...
            expect(spySync).not.toHaveBeenCalled();
            expect(spySpinner).not.toHaveBeenCalled();
            expect(spyInstaller).not.toHaveBeenCalled();
        });
    });
});
