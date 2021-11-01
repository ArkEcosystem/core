import { Server } from "@hapi/hapi";
import Joi from "joi";
import { Container } from "@arkecosystem/core-kernel";

import { ValidatePlugin } from "@arkecosystem/core-p2p/src/socket-server/plugins/validate";
import * as utils from "@arkecosystem/core-p2p/src/utils";

const spyIsValidVersion = jest.spyOn(utils, "isValidVersion").mockReturnValue(true);

describe("ValidatePlugin", () => {
    let validatePlugin: ValidatePlugin;

    const container = new Container.Container();

    const logger = { warning: jest.fn(), debug: jest.fn() };
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
    });

    beforeEach(() => {
        validatePlugin = container.resolve<ValidatePlugin>(ValidatePlugin);
    });

    it("should register the validate plugin", async () => {
        const server = new Server({ port: 4100 });
        server.route(mockRoute);

        const spyExt = jest.spyOn(server, "ext");

        validatePlugin.register(server);

        expect(spyExt).toBeCalledWith(expect.objectContaining({ type: "onPostAuth" }));

        // try the route with a valid payload
        const responseValid = await server.inject({
            method: "POST",
            url: "/p2p/peer/mockroute",
            payload: {},
        });
        expect(JSON.parse(responseValid.payload)).toEqual(responsePayload);
        expect(responseValid.statusCode).toBe(200);

        // try with an invalid payload
        const responseInvalid = await server.inject({
            method: "POST",
            url: "/p2p/peer/mockroute",
            payload: { unwantedProp: 1 },
        });
        expect(responseInvalid.statusCode).toBe(400);
        expect(responseInvalid.result).toEqual({
            error: "Bad Request",
            message: "Validation failed",
            statusCode: 400,
        });

        // try with an invalid version
        spyIsValidVersion.mockReturnValueOnce(false);
        const responseInvalidVersion = await server.inject({
            method: "POST",
            url: "/p2p/peer/mockroute",
            payload: { headers: { version: "2.0.0" } },
        });
        expect(responseInvalidVersion.statusCode).toBe(400);
        expect(responseInvalidVersion.result).toEqual({
            error: "Bad Request",
            message: "Validation failed (invalid version)",
            statusCode: 400,
        });

        // try with another route
        const testRoute = {
            method: "POST",
            path: "/p2p/peer/testroute",
            config: {
                handler: () => {
                    return { status: "ok" };
                },
            },
        };

        server.route(testRoute);
        const responseValidAnotherRoute = await server.inject({
            method: "POST",
            url: "/p2p/peer/testroute",
            payload: {},
        });
        expect(JSON.parse(responseValidAnotherRoute.payload)).toEqual(responsePayload);
        expect(responseValidAnotherRoute.statusCode).toBe(200);
    });
});
