import { Server } from "@hapi/hapi";
import Joi from "@hapi/joi";
import { Container } from "@arkecosystem/core-kernel";

import { IsAppReadyPlugin } from "@arkecosystem/core-p2p/src/socket-server/plugins/is-app-ready";
import { protocol } from "@arkecosystem/core-p2p/src/hapi-nes/utils";

afterEach(() => {
    jest.clearAllMocks();
});

describe("IsAppReadyPlugin", () => {
    let isAppReadyPlugin: IsAppReadyPlugin;

    const container = new Container.Container();

    const responsePayload = { status: "ok" };
    const mockRouteByPath = {
        "/p2p/peer/mockroute": {
            id: "p2p.peer.getPeers",
            handler: () => responsePayload,
            validation: Joi.object().max(0),
        },
    };
    const mockRoute = {
        method: "POST",
        path: "/p2p/peer/mockroute",
        config: {
            id: mockRouteByPath["/p2p/peer/mockroute"].id,
            handler: mockRouteByPath["/p2p/peer/mockroute"].handler,
        },
    };

    const blockchainService = { isBooted: jest.fn().mockReturnValue(true) };
    const app = {
        isBound: jest.fn().mockReturnValue(true),
        get: jest.fn().mockReturnValue(blockchainService),
        resolve: jest.fn().mockReturnValue({ getRoutesConfigByPath: () => mockRouteByPath }),
    };

    beforeAll(() => {
        container.unbindAll();
        container.bind(Container.Identifiers.Application).toConstantValue(app);
    });

    beforeEach(() => {
        isAppReadyPlugin = container.resolve<IsAppReadyPlugin>(IsAppReadyPlugin);
    });

    it("should register the plugin", async () => {
        const server = new Server({ port: 4100 });
        server.route(mockRoute);

        const spyExt = jest.spyOn(server, "ext");

        isAppReadyPlugin.register(server);

        expect(spyExt).toBeCalledWith(expect.objectContaining({ type: "onPostAuth" }));

        // try the route with a valid payload
        const remoteAddress = "187.166.55.44";
        const responseValid = await server.inject({
            method: "POST",
            url: "/p2p/peer/mockroute",
            payload: {},
            remoteAddress,
        });
        expect(JSON.parse(responseValid.payload)).toEqual(responsePayload);
        expect(responseValid.statusCode).toBe(200);
        expect(app.isBound).toBeCalledTimes(1);
        expect(blockchainService.isBooted).toBeCalledTimes(1);
    });

    it("should return a forbidden error when blockchain service is not bound", async () => {
        const server = new Server({ port: 4100 });
        server.route(mockRoute);
        isAppReadyPlugin.register(server);

        app.isBound.mockReturnValueOnce(false);

        // try the route with a valid payload
        const remoteAddress = "187.166.55.44";
        const response = await server.inject({
            method: "POST",
            url: "/p2p/peer/mockroute",
            payload: {},
            remoteAddress,
        });
        expect(response.statusCode).toBe(protocol.gracefulErrorStatusCode);
        expect(app.isBound).toBeCalledTimes(1);
        expect(blockchainService.isBooted).toBeCalledTimes(0);
    });

    it("should return a forbidden error when blockchain service is not booted", async () => {
        const server = new Server({ port: 4100 });
        server.route(mockRoute);
        isAppReadyPlugin.register(server);

        blockchainService.isBooted.mockReturnValueOnce(false);

        // try the route with a valid payload
        const remoteAddress = "187.166.55.44";
        const response = await server.inject({
            method: "POST",
            url: "/p2p/peer/mockroute",
            payload: {},
            remoteAddress,
        });
        expect(response.statusCode).toBe(protocol.gracefulErrorStatusCode);
        expect(app.isBound).toBeCalledTimes(1);
        expect(blockchainService.isBooted).toBeCalledTimes(1);
    });

    it("should not be called on another route", async () => {
        const testRoute = {
            method: "POST",
            path: "/p2p/peer/testroute",
            config: {
                handler: () => {
                    return { status: "ok" };
                },
            },
        };

        const server = new Server({ port: 4100 });
        server.route(testRoute);
        server.route(mockRoute);

        const spyExt = jest.spyOn(server, "ext");

        isAppReadyPlugin.register(server);

        expect(spyExt).toBeCalledWith(expect.objectContaining({ type: "onPostAuth" }));

        // try the route with a valid payload
        const remoteAddress = "187.166.55.44";
        const responseValid = await server.inject({
            method: "POST",
            url: "/p2p/peer/testroute",
            payload: {},
            remoteAddress,
        });
        expect(JSON.parse(responseValid.payload)).toEqual(responsePayload);
        expect(responseValid.statusCode).toBe(200);
        expect(app.isBound).toBeCalledTimes(1);
        expect(blockchainService.isBooted).toBeCalledTimes(1);
    });
});
