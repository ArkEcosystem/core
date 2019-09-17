import "jest-extended";

import nock from "nock";
import { dirSync, setGracefulCleanup } from "tmp";
import cli from "cli-ux";
import Chalk from "chalk";

import { init } from "@packages/core/src/hooks/init/update";
import { versionLatest } from "../../common/__fixtures__/latest-version";

beforeEach(() => nock.cleanAll());

beforeAll(() => nock.disableNetConnect());

afterAll(() => {
    nock.enableNetConnect();

    setGracefulCleanup();
});

describe.skip("Hooks > Init > Update", () => {
    it("should not check for updates if the update command is running", async () => {
        // Arrange
        const start = jest.spyOn(cli.action, "start");

        // Act
        // @ts-ignore
        await init({
            id: "update",
            config: { configDir: dirSync().name, version: "3.0.0", bin: "ark" },
        });

        // Assert
        expect(start).not.toHaveBeenCalled();

        // Reset
        start.mockReset();
    });

    it("should report the availability of an update", async () => {
        // Arrange
        nock(/.*/)
            .get("/@arkecosystem%2Fcore")
            .reply(200, versionLatest);

        // const url = jest.spyOn(cli, "url");
        const warn = jest.fn();

        const config = {
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
        expect(warn).toHaveBeenCalledWith(
            `${config.name} update available from ${Chalk.greenBright("2.0.0")} to ${Chalk.greenBright(
                "2.5.24",
            )}. Review the latest release and run "ark update" once you wish to update.`,
        );
        // expect(url).toHaveBeenCalledWith(
        //     "Click here to read the changelog for 2.5.24.",
        //     "https://github.com/ARKEcosystem/core/blob/master/CHANGELOG.md",
        // );
    });

    it("should report the unavailability of an update", async () => {
        // Arrange
        nock(/.*/)
            .get("/@arkecosystem%2Fcore")
            .reply(200, versionLatest);

        const warn = jest.fn();

        const config = {
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
        expect(warn).not.toHaveBeenCalled();
    });
});
