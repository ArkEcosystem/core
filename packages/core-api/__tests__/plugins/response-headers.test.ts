import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import { responseHeaders } from "@packages/core-api/src/plugins/response-headers";

const getLastHeight = jest.fn();
const app = { get: (id) => ({ getLastHeight }) };

describe("responseHeaders.register", () => {
    it("should register onPreResponse extension", () => {
        const server: Partial<Hapi.Server> = {
            ext: jest.fn(),
            app: { app } as any,
        };

        responseHeaders.register(server as Hapi.Server);

        expect(server.ext).toBeCalledWith("onPreResponse", expect.any(Function));
    });
});

describe("responseHeaders.getOnPreResponse", () => {
    it("should add header X-Block-Height with last block height from app blockchain getLastHeight()", () => {
        const onPreResponse = responseHeaders.getOnPreResponseHandler(app as any);
        const height = 2346;
        const headers: Hapi.Util.Dictionary<string | string[]> = {};
        getLastHeight.mockReturnValueOnce(height);

        const request: Partial<Hapi.Request> = {
            response: { headers } as Hapi.ResponseObject,
        };

        const h: Partial<Hapi.ResponseToolkit> = {
            continue: Symbol(),
        };

        const ret = onPreResponse(request as Hapi.Request, h as Hapi.ResponseToolkit);

        expect(headers["X-Block-Height"]).toEqual(height);

        expect(ret).toBe(h.continue);
    });

    it("should add header X-Block-Height to response.output headers when response is error", () => {
        const onPreResponse = responseHeaders.getOnPreResponseHandler(app as any);
        const height = 2346;
        getLastHeight.mockReturnValueOnce(height);

        const request: Partial<Hapi.Request> = {
            response: Boom.badData("Bad data"),
        };

        const h: Partial<Hapi.ResponseToolkit> = {
            continue: Symbol(),
        };

        const ret = onPreResponse(request as Hapi.Request, h as Hapi.ResponseToolkit);

        expect((request.response as Boom.Boom).output.headers["X-Block-Height"]).toEqual(height);

        expect(ret).toBe(h.continue);
    });
});
