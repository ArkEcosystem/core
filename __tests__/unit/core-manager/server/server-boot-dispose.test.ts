import "jest-extended";

import { Container } from "@packages/core-kernel";
import { Sandbox } from "@packages/core-test-framework";
import { Identifiers } from "@packages/core-manager/src/ioc";
import { Server } from "@packages/core-manager/src/server/server";
import { ActionReader } from "@packages/core-manager/src/action-reader";
import { PluginFactory } from "@packages/core-manager/src/server/plugins/plugin-factory";
import { defaults } from "@packages/core-manager/src/defaults";

let sandbox: Sandbox;
let server: Server;
const pluginsConfiguration = defaults.plugins;

const logger = {
    info: jest.fn(),
    notice: jest.fn(),
    error: jest.fn(),
};

let mockStart = jest.fn();
let mockStop = jest.fn();
const mockJsonRPCRoute = {
    method: "post",
    path: "/",
    settings: {
        timeout: {},
    },
};

jest.mock("@hapi/hapi", () => {
    return {
        Server: jest.fn().mockImplementation(() => {
            return {
                app: jest.fn(),
                info: {
                    uri: "dummy_uri",
                },
                register: jest.fn(),
                start: jest.fn().mockImplementation(mockStart),
                stop: jest.fn().mockImplementation(mockStop),
                table: jest.fn().mockReturnValue([mockJsonRPCRoute]),
            };
        }),
    };
});

beforeEach(() => {
    pluginsConfiguration.basicAuthentication.enabled = false;

    sandbox = new Sandbox();

    sandbox.app.bind(Identifiers.HTTP_JSON_RPC).to(Server).inSingletonScope();
    sandbox.app.bind(Identifiers.ActionReader).to(ActionReader).inSingletonScope();
    sandbox.app.bind(Identifiers.PluginFactory).to(PluginFactory).inSingletonScope();
    sandbox.app.bind(Identifiers.BasicCredentialsValidator).toConstantValue({});
    sandbox.app.bind(Identifiers.TokenValidator).toConstantValue({});

    sandbox.app.bind(Container.Identifiers.LogService).toConstantValue(logger);
    sandbox.app.bind(Container.Identifiers.PluginConfiguration).toConstantValue({
        get: jest.fn().mockReturnValue(pluginsConfiguration),
    });

    sandbox.app.terminate = jest.fn();

    server = sandbox.app.get<Server>(Identifiers.HTTP_JSON_RPC);
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("Server", () => {
    describe("boot", () => {
        it("should be ok", async () => {
            await expect(server.initialize("serverName", {})).toResolve();

            await expect(server.boot()).toResolve();
            await expect(mockStart).toHaveBeenCalled();
            await expect(logger.info).toHaveBeenCalled();
        });

        it("should terminate if error in start", async () => {
            mockStart = jest.fn().mockImplementation(async () => {
                throw new Error();
            });

            await expect(server.initialize("serverName", {})).toResolve();

            await expect(server.boot()).toResolve();
            await expect(mockStart).toHaveBeenCalled();
            await expect(logger.info).not.toHaveBeenCalled();
        });
    });

    describe("dispose", () => {
        it("should be ok", async () => {
            await expect(server.initialize("serverName", {})).toResolve();

            await expect(server.dispose()).toResolve();
            await expect(mockStop).toHaveBeenCalled();
            await expect(logger.info).toHaveBeenCalled();
        });

        it("should terminate if error in start", async () => {
            mockStop = jest.fn().mockImplementation(async () => {
                throw new Error();
            });

            await expect(server.initialize("serverName", {})).toResolve();

            await expect(server.dispose()).toResolve();
            await expect(mockStop).toHaveBeenCalled();
            await expect(logger.info).not.toHaveBeenCalled();
        });
    });
});
