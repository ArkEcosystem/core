import "jest-extended";

import nock from "nock";
import fs from "fs-extra";
import { dirSync, setGracefulCleanup } from "tmp";
// import cli from "cli-ux";
import Chalk from "chalk";

import { init } from "@packages/core/src/hooks/init/update";
import { versionLatest } from "../../common/__fixtures__/latest-version";

beforeEach(() => nock.cleanAll());

beforeAll(() => nock.disableNetConnect());

afterAll(() => {
    nock.enableNetConnect();

    setGracefulCleanup();
});

describe("Hooks > Init > Update", () => {
    it("should not check for updates if the update command is running", async () => {
        // Arrange
        const ensureDirSync = jest.spyOn(fs, "ensureDirSync");

        // Act
        // @ts-ignore
        await init({
            id: "update",
            config: { configDir: dirSync().name, version: "3.0.0", bin: "ark" },
        });

        // Assert
        expect(ensureDirSync).not.toHaveBeenCalled();

        // Reset
        ensureDirSync.mockReset();
    });

    it("should not check for updates if already done recently", async () => {
        // Arrange
        const ensureDirSync = jest.spyOn(fs, "ensureDirSync");
        const ensureFileSync = jest.spyOn(fs, "ensureFileSync");

        const config = { cacheDir: dirSync().name, configDir: dirSync().name, version: "3.0.0", bin: "ark" };

        // Act
        // @ts-ignore
        await init({
            id: "non-update",
            config,
        });

        // Assert
        expect(ensureDirSync).toHaveBeenCalledWith(config.cacheDir);
        expect(ensureFileSync).toHaveBeenCalledWith(`${config.cacheDir}/update`);

        // Reset
        ensureDirSync.mockReset();
        ensureFileSync.mockReset();
    });

    it("should report the availability of an update", async () => {
        // Arrange
        nock("https://registry.npmjs.org")
            .get("/@arkecosystem%2Fcore")
            .reply(200, versionLatest);

        const ensureDirSync = jest.spyOn(fs, "ensureDirSync");
        const ensureFileSync = jest.spyOn(fs, "ensureFileSync");
        const statSync = jest
            .spyOn(fs, "statSync")
            // @ts-ignore
            .mockReturnValue({ mtime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1) });
        // const url = jest.spyOn(cli, "url");
        const warn = jest.fn();

        const config = {
            cacheDir: dirSync().name,
            configDir: dirSync().name,
            name: "@arkecosystem/core",
            version: "2.0.0",
            bin: "ark",
        };

        // Act
        // @ts-ignore
        await init.call(
            { warn, config },
            {
                id: "non-update",
                config,
            },
        );

        // Assert
        expect(ensureDirSync).toHaveBeenCalledWith(config.cacheDir);
        expect(ensureFileSync).toHaveBeenCalledWith(`${config.cacheDir}/update`);
        expect(statSync).toHaveBeenCalledWith(`${config.cacheDir}/update`);
        expect(warn).toHaveBeenCalledWith(
            `${config.name} update available from ${Chalk.greenBright("2.0.0")} to ${Chalk.greenBright(
                "2.5.24",
            )}. Review the latest release and run "ark update" once you wish to update.`,
        );
        // expect(url).toHaveBeenCalledWith(
        //     "Click here to read the changelog for 2.5.24.",
        //     "https://github.com/ARKEcosystem/core/blob/master/CHANGELOG.md",
        // );

        // Reset
        ensureDirSync.mockReset();
        ensureFileSync.mockReset();
        statSync.mockReset();
    });

    it("should report the unavailability of an update", async () => {
        // Arrange
        nock("https://registry.npmjs.org")
            .get("/@arkecosystem%2Fcore")
            .reply(200, versionLatest);

        const ensureDirSync = jest.spyOn(fs, "ensureDirSync");
        const ensureFileSync = jest.spyOn(fs, "ensureFileSync");
        const statSync = jest
            .spyOn(fs, "statSync")
            // @ts-ignore
            .mockReturnValue({ mtime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1) });
        const warn = jest.fn();

        const config = {
            cacheDir: dirSync().name,
            configDir: dirSync().name,
            name: "@arkecosystem/core",
            version: "3.0.0",
            bin: "ark",
        };

        // Act
        // @ts-ignore
        await init.call(
            { warn, config },
            {
                id: "non-update",
                config,
            },
        );

        // Assert
        expect(ensureDirSync).toHaveBeenCalledWith(config.cacheDir);
        expect(ensureFileSync).toHaveBeenCalledWith(`${config.cacheDir}/update`);
        expect(statSync).toHaveBeenCalledWith(`${config.cacheDir}/update`);
        expect(warn).not.toHaveBeenCalled();

        // Reset
        ensureDirSync.mockReset();
        ensureFileSync.mockReset();
        statSync.mockReset();
    });
});
