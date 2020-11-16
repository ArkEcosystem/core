import { Container } from "@arkecosystem/core-kernel";
import * as Nes from "@arkecosystem/core-p2p/src/hapi-nes";
import { Server } from "@arkecosystem/core-p2p/src/socket-server/server";
import hapi from "@hapi/hapi";

import { NesClient } from "../mocks/nes";

jest.spyOn(Nes, "Client").mockImplementation((url) => new (NesClient as any)());

const hapiServer = {
    start: jest.fn(),
    stop: jest.fn(),
    inject: jest.fn(),
    route: jest.fn(),
    register: jest.fn(),
    app: {},
} as any;
const spyHapiServer = jest.spyOn(hapi, "Server").mockReturnValue(hapiServer);

describe("Server", () => {
    const serverSymbol = Symbol.for("P2P<Server>");
    let server: Server;

    const container = new Container.Container();

    const logger = { warning: jest.fn(), debug: jest.fn(), info: jest.fn() };
    const app = {
        log: logger,
        terminate: jest.fn(),
        resolve: jest.fn().mockReturnValue({ register: jest.fn() }),
    };

    beforeAll(() => {
        container.unbindAll();
        container.bind(Container.Identifiers.LogService).toConstantValue(logger);
        container.bind(Container.Identifiers.Application).toConstantValue(app);
        container.bind(serverSymbol).to(Server);
    });

    beforeEach(() => {
        server = container.get<Server>(serverSymbol);

        // "manually" reset mocked functions (as jest.resetAllMocks() messes up here)
        app.terminate = jest.fn();
        app.resolve = jest.fn().mockReturnValue({ register: jest.fn() });
        logger.warning = jest.fn();
        logger.debug = jest.fn();
        hapiServer.start = jest.fn();
        hapiServer.stop = jest.fn();
        hapiServer.inject = jest.fn();
        hapiServer.route = jest.fn();
        hapiServer.register = jest.fn();
        hapiServer.info = { uri: "" };
    });

    const name = "P2P server";
    const options = { hostname: "127.0.0.1", port: 4000 };

    describe("initialize", () => {
        it("should instantiate a new Hapi server", async () => {
            await server.initialize(name, options);

            expect(spyHapiServer).toBeCalledTimes(1);
            expect(hapiServer.register).toHaveBeenCalledWith({
                plugin: Nes.plugin,
                options: { maxPayload: 20971520 },
            });
        });
    });

    describe("boot", () => {
        it("should call server.start()", async () => {
            await server.initialize(name, options);
            await server.boot();

            expect(hapiServer.start).toBeCalledTimes(1);
            expect(app.terminate).not.toBeCalled();
        });

        it("should terminate app if server.start() failed", async () => {
            await server.initialize(name, options);

            hapiServer.start = jest.fn().mockRejectedValueOnce(new Error("failed starting hapi server"));
            await server.boot();

            expect(hapiServer.start).toBeCalledTimes(1);
            expect(app.terminate).toBeCalledTimes(1);
        });
    });

    describe("dispose", () => {
        it("should call server.stop()", async () => {
            await server.initialize(name, options);
            await server.dispose();

            expect(hapiServer.stop).toBeCalledTimes(1);
            expect(app.terminate).not.toBeCalled();
        });

        it("should terminate app if server.stop() failed", async () => {
            await server.initialize(name, options);

            hapiServer.stop = jest.fn().mockRejectedValueOnce(new Error("failed stopping hapi server"));
            await server.dispose();

            expect(hapiServer.stop).toBeCalledTimes(1);
            expect(app.terminate).toBeCalledTimes(1);
        });
    });

    describe("register", () => {
        it("should call server.register() with the options provided - for each server", async () => {
            await server.initialize(name, options);
            hapiServer.register.mockReset();

            const plugin = { name: "my plugin" };
            await server.register(plugin);

            expect(hapiServer.register).toBeCalledTimes(1);
            expect(hapiServer.register).toBeCalledWith(plugin);
        });
    });

    describe("route", () => {
        it("should call server.register() with the options provided - for each server", async () => {
            await server.initialize(name, options);
            hapiServer.route.mockReset();

            const route = { method: "POST", path: "/the/path" };
            await server.route(route);

            expect(hapiServer.route).toBeCalledTimes(1);
            expect(hapiServer.route).toBeCalledWith(route);
        });
    });

    describe("inject", () => {
        it("should call server.register() with the options provided - for each server", async () => {
            await server.initialize(name, options);
            hapiServer.inject.mockReset();

            const toInject = { name: "thing to inject" };
            await server.inject(toInject);

            expect(hapiServer.inject).toBeCalledTimes(1);
            expect(hapiServer.inject).toBeCalledWith(toInject);
        });
    });
});
