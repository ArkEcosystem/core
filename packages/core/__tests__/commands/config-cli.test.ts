import { Command } from "@packages/core/src/commands/config-cli";
import { Container } from "@packages/core-cli";
import { Installer } from "@packages/core-cli/src/services";
import { Console } from "@packages/core-test-framework";

let cli;
let config;
let installer: Partial<Installer>;

beforeEach(() => {
    installer = {
        install: jest.fn(),
    };

    cli = new Console();
    cli.app.rebind(Container.Identifiers.Installer).toConstantValue(installer);
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
        await cli.withFlags({ channel: "latest" }).execute(Command);

        expect(config.get("channel")).toBe("latest");
        expect(installer.install).toHaveBeenCalledWith("@arkecosystem/core", "latest");

        await cli.withFlags({ channel: "next" }).execute(Command);

        expect(config.get("channel")).toBe("next");
        expect(installer.install).toHaveBeenCalledWith("@arkecosystem/core", "next");

        await cli.withFlags({ channel: "latest" }).execute(Command);

        expect(config.get("channel")).toBe("latest");
        expect(installer.install).toHaveBeenCalledWith("@arkecosystem/core", "latest");
    });

    it("should fail to change the channel if the new and old are the same", async () => {
        await cli.withFlags({ channel: "latest" }).execute(Command);

        await expect(cli.withFlags({ channel: "latest" }).execute(Command)).rejects.toThrow(
            'You are already on the "latest" channel.',
        );
    });
});
