import { Server } from "@hapi/hapi";
import Joi from "joi";
import { Container } from "@packages/core-kernel";
import { defaults } from "@packages/core-p2p/src/defaults";
import { PeerProcessor } from "@packages/core-p2p/src/peer-processor";
import { WhitelistForgerPlugin } from "@packages/core-p2p/src/socket-server/plugins/whitelist-forger";

describe("WhitelistForgerPlugin", () => {
    let whitelistForgerPlugin: WhitelistForgerPlugin;
    let spyPeerProcessorWhitelisted;
    const peerProcessor = new PeerProcessor();

    const container = new Container.Container();

    const logger = { warning: jest.fn(), debug: jest.fn() };

    const pluginConfiguration = {
        getOptional: (_) => defaults.remoteAccess,
    };

    // @ts-ignore
    peerProcessor.configuration = pluginConfiguration;

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
        whitelistForgerPlugin = container.resolve<WhitelistForgerPlugin>(WhitelistForgerPlugin);
        spyPeerProcessorWhitelisted = jest.spyOn(peerProcessor, "isWhitelisted");
    });

    afterEach(() => spyPeerProcessorWhitelisted.mockClear());

    it("should register the isWhitelisted plugin", async () => {
        const server = new Server({ port: 4100 });
        server.route(mockRoute);

        const spyExt = jest.spyOn(server, "ext");

        whitelistForgerPlugin.register(server);

        expect(spyExt).toBeCalledWith(expect.objectContaining({ type: "onPreAuth" }));
    });

    it("should authorize default whitelisted IPs", async () => {
        const server = new Server({ port: 4100 });
        server.route(mockRoute);

        const spyExt = jest.spyOn(server, "ext");

        whitelistForgerPlugin.register(server);

        expect(spyExt).toBeCalledWith(expect.objectContaining({ type: "onPreAuth" }));

        // try the route with a valid remoteAddress
        const remoteAddress = defaults.remoteAccess[0];
        const responseValid = await server.inject({
            method: "POST",
            url: "/p2p/peer/mockroute",
            payload: {},
            remoteAddress,
        });
        expect(JSON.parse(responseValid.payload)).toEqual(responsePayload);
        expect(responseValid.statusCode).toBe(200);
        expect(spyPeerProcessorWhitelisted).toBeCalledTimes(1);
        expect(spyPeerProcessorWhitelisted).toBeCalledWith({ ip: remoteAddress });
    });

    it("should not authorize none-whitelisted IPs", async () => {
        const server = new Server({ port: 4100 });
        server.route(mockRoute);

        const spyExt = jest.spyOn(server, "ext");

        whitelistForgerPlugin.register(server);

        expect(spyExt).toBeCalledWith(expect.objectContaining({ type: "onPreAuth" }));

        // try the route with an invalid remoteAddress
        const remoteAddress = "187.166.55.44";
        const responseInvalid = await server.inject({
            method: "POST",
            url: "/p2p/peer/mockroute",
            payload: {},
            remoteAddress,
        });

        const invalidResponsePayload = {
            error: "Forbidden",
            message: "IP unauthorized on internal route",
            statusCode: 403,
        };
        expect(JSON.parse(responseInvalid.payload)).toEqual(invalidResponsePayload);
        expect(responseInvalid.statusCode).not.toBe(200);
        expect(spyPeerProcessorWhitelisted).toBeCalledTimes(1);
        expect(spyPeerProcessorWhitelisted).toBeCalledWith({ ip: remoteAddress });
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

        whitelistForgerPlugin.register(server);

        expect(spyExt).toBeCalledWith(expect.objectContaining({ type: "onPreAuth" }));

        // try the route with a valid remoteAddress
        const remoteAddress = defaults.remoteAccess[0];
        const responseValid = await server.inject({
            method: "POST",
            url: "/p2p/peer/testroute",
            payload: {},
            remoteAddress,
        });
        expect(JSON.parse(responseValid.payload)).toEqual(responsePayload);
        expect(responseValid.statusCode).toBe(200);
        expect(spyPeerProcessorWhitelisted).toBeCalledTimes(0);
    });
});
