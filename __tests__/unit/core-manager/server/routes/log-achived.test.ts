import "jest-extended";

import { Container } from "@packages/core-kernel";
import { ActionReader } from "@packages/core-manager/src/action-reader";
import { Actions } from "@packages/core-manager/src/contracts";
import { defaults } from "@packages/core-manager/src/defaults";
import { Identifiers } from "@packages/core-manager/src/ioc";
import Handlers from "@packages/core-manager/src/server/handlers";
import { PluginFactory } from "@packages/core-manager/src/server/plugins/plugin-factory";
import { Server } from "@packages/core-manager/src/server/server";
import { Argon2id, SimpleTokenValidator } from "@packages/core-manager/src/server/validators";
import { Sandbox } from "@packages/core-test-framework";

let sandbox: Sandbox;
let server: Server;

const logger = {
    info: jest.fn(),
    notice: jest.fn(),
    error: jest.fn(),
};

let pluginsConfiguration;

const mockFilesystem = {
    get: jest.fn().mockResolvedValue(Buffer.from("file_content")),
};

beforeEach(() => {
    const actionReader: Partial<ActionReader> = {
        discoverActions(): Actions.Method[] {
            return [];
        },
    };

    pluginsConfiguration = { ...defaults.plugins };

    pluginsConfiguration.basicAuthentication.enabled = false;
    pluginsConfiguration.tokenAuthentication.enabled = false;

    sandbox = new Sandbox();

    sandbox.app.bind(Identifiers.HTTP).to(Server).inSingletonScope();
    sandbox.app.bind(Identifiers.ActionReader).toConstantValue(actionReader);
    sandbox.app.bind(Identifiers.PluginFactory).to(PluginFactory).inSingletonScope();
    sandbox.app.bind(Identifiers.BasicCredentialsValidator).to(Argon2id).inSingletonScope();
    sandbox.app.bind(Identifiers.TokenValidator).to(SimpleTokenValidator).inSingletonScope();

    sandbox.app.bind(Container.Identifiers.LogService).toConstantValue(logger);
    sandbox.app.bind(Container.Identifiers.FilesystemService).toConstantValue(mockFilesystem);
    sandbox.app.bind(Container.Identifiers.PluginConfiguration).toConstantValue({
        get: jest.fn().mockReturnValue(pluginsConfiguration),
    });

    sandbox.app.terminate = jest.fn();

    server = sandbox.app.get<Server>(Identifiers.HTTP);
});

afterEach(async () => {
    await server.dispose();
    jest.clearAllMocks();
    jest.restoreAllMocks();
});

describe("LogArchived", () => {
    it("should be ok", async () => {
        await server.initialize("serverName", {});

        await server.register({
            plugin: Handlers,
        });

        await server.boot();

        const injectOptions = {
            method: "GET",
            url: "/log/archived/ark-core-out.log",
        };

        const response = await server.inject(injectOptions);

        expect(response.result).toEqual("file_content");
    });
});
