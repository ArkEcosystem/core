import { Container } from "@arkecosystem/core-cli";
import { Console } from "@arkecosystem/core-test-framework";
import { Command } from "@packages/core/src/commands/config-cli";

import execa from "../../../../__mocks__/execa";

let cli;
let config;

beforeEach(() => {
    cli = new Console();
    config = cli.app.get(Container.Identifiers.Config);
});

afterEach(() => jest.resetAllMocks());

describe("Command", () => {
    it("should change the token", async () => {
        await cli.execute(Command);

        expect(config.get("token")).toBe("ark");

        await cli.withFlags({ token: "btc" }).execute(Command);

        expect(config.get("token")).toBe("btc");
    });

    it("should not set config token if no token is passed to command", async () => {
        cli = new Console(false);

        const spyGetPaths = jest.spyOn(
            // @ts-ignore
            cli.app.get<Services.Environment>(Container.Identifiers.Environment),
            "getPaths",
        );

        spyGetPaths.mockImplementation(() => {});

        await expect(cli.execute(Command)).toResolve();

        const spySetToken = jest.spyOn(config, "set");

        expect(spySetToken).not.toHaveBeenCalled();
    });

    it("should change the channel and install the new version", async () => {
        jest.spyOn(execa, "sync").mockReturnValue({
            stdout: '"null"',
            stderr: undefined,
            exitCode: 0,
        });

        const install: jest.SpyInstance = jest
            .spyOn(cli.app.get(Container.Identifiers.Installer), "install")
            .mockImplementation();

        await cli.withFlags({ channel: "latest" }).execute(Command);

        expect(config.get("channel")).toBe("latest");
        expect(install).toHaveBeenCalledWith("@arkecosystem/core", "latest");

        await cli.withFlags({ channel: "next" }).execute(Command);

        expect(config.get("channel")).toBe("next");
        expect(install).toHaveBeenCalledWith("@arkecosystem/core", "next");

        await cli.withFlags({ channel: "latest" }).execute(Command);

        expect(config.get("channel")).toBe("latest");
        expect(install).toHaveBeenCalledWith("@arkecosystem/core", "latest");
    });

    it("should fail to change the channel if the new and old are the same", async () => {
        jest.spyOn(execa, "sync").mockReturnValue({
            stdout: '"null"',
            stderr: undefined,
            exitCode: 0,
        });

        await cli.withFlags({ channel: "latest" }).execute(Command);

        await expect(cli.withFlags({ channel: "latest" }).execute(Command)).rejects.toThrow(
            'You are already on the "latest" channel.',
        );
    });
});
