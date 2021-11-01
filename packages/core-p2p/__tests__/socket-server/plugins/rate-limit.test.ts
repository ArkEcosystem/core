import { Server } from "@hapi/hapi";
import Joi from "joi";
import { Container } from "@arkecosystem/core-kernel";

import { RateLimitPlugin } from "@arkecosystem/core-p2p/src/socket-server/plugins/rate-limit";
import * as utils from "@arkecosystem/core-p2p/src/utils/build-rate-limiter";

afterEach(() => {
    jest.clearAllMocks();
});

describe("RateLimitPlugin", () => {
    let rateLimitPlugin: RateLimitPlugin;

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

    const app = {
        resolve: jest.fn().mockReturnValue({ getRoutesConfigByPath: () => mockRouteByPath }),
    };
    const pluginConfiguration = { getOptional: (id, defaultValue) => defaultValue };
    const rateLimiter = {
        hasExceededRateLimit: jest.fn().mockReturnValue(false),
    };

    beforeAll(() => {
        container.unbindAll();
        container.bind(Container.Identifiers.Application).toConstantValue(app);
        container.bind(Container.Identifiers.PluginConfiguration).toConstantValue(pluginConfiguration);

        jest.spyOn(utils, "buildRateLimiter").mockReturnValue(rateLimiter as any);
    });

    beforeEach(() => {
        rateLimitPlugin = container.resolve<RateLimitPlugin>(RateLimitPlugin);
    });

    it("should register the plugin", async () => {
        const server = new Server({ port: 4100 });
        server.route(mockRoute);

        const spyExt = jest.spyOn(server, "ext");

        rateLimitPlugin.register(server);

        expect(spyExt).toBeCalledWith(expect.objectContaining({ type: "onPreAuth" }));

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
        expect(rateLimiter.hasExceededRateLimit).toBeCalledTimes(1);
    });

    it("should return a tooManyRequests error when exceeded rate limit", async () => {
        const server = new Server({ port: 4100 });
        server.route(mockRoute);
        rateLimitPlugin.register(server);

        rateLimiter.hasExceededRateLimit.mockReturnValueOnce(true);

        // try the route with a valid payload
        const remoteAddress = "187.166.55.44";
        const responseForbidden = await server.inject({
            method: "POST",
            url: "/p2p/peer/mockroute",
            payload: {},
            remoteAddress,
        });
        expect(responseForbidden.statusCode).toBe(429);
        expect(rateLimiter.hasExceededRateLimit).toBeCalledTimes(1);
    });
});
