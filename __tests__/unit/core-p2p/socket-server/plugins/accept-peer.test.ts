import { Server } from "@hapi/hapi";
import Joi from "joi";
import { Container } from "@arkecosystem/core-kernel";

import { AcceptPeerPlugin } from "@arkecosystem/core-p2p/src/socket-server/plugins/accept-peer";

afterEach(() => {
    jest.clearAllMocks();
});

describe("AcceptPeerPlugin", () => {
    let acceptPeerPlugin: AcceptPeerPlugin;

    const container = new Container.Container();

    const logger = { warning: jest.fn(), debug: jest.fn() };
    const peerProcessor = { validateAndAcceptPeer: jest.fn() };

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
    const app = { resolve: jest.fn().mockReturnValue({ getRoutesConfigByPath: () => mockRouteByPath }) };

    beforeAll(() => {
        container.unbindAll();
        container.bind(Container.Identifiers.LogService).toConstantValue(logger);
        container.bind(Container.Identifiers.Application).toConstantValue(app);
        container.bind(Container.Identifiers.PeerProcessor).toConstantValue(peerProcessor);
    });

    beforeEach(() => {
        acceptPeerPlugin = container.resolve<AcceptPeerPlugin>(AcceptPeerPlugin);
    });

    it("should register the validate plugin", async () => {
        const server = new Server({ port: 4100 });
        server.route(mockRoute);

        const spyExt = jest.spyOn(server, "ext");

        acceptPeerPlugin.register(server);

        expect(spyExt).toBeCalledWith(expect.objectContaining({ type: "onPreHandler" }));

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
        expect(peerProcessor.validateAndAcceptPeer).toBeCalledTimes(1);
        expect(peerProcessor.validateAndAcceptPeer).toBeCalledWith({ ip: remoteAddress });
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

        acceptPeerPlugin.register(server);

        expect(spyExt).toBeCalledWith(expect.objectContaining({ type: "onPreHandler" }));

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
        expect(peerProcessor.validateAndAcceptPeer).toBeCalledTimes(0);
    });
});
