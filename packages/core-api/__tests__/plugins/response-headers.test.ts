import { responseHeaders } from "@packages/core-api/src/plugins/response-headers";

const getLastHeight = jest.fn();
const app = { get: (id) => ({ getLastHeight }) };

describe("responseHeaders.register", () => {
    it("should register onPreResponse extension", () => {
        const server = {
            ext: jest.fn(),
            app: { app },
        };

        responseHeaders.register(server);

        expect(server.ext).toBeCalledWith("onPreResponse", expect.any(Function));
    });
});

describe("responseHeaders.getOnPreResponse", () => {
    it("should add header X-Block-Height with last block height from app blockchain getLastHeight()", () => {
        const onPreResponse = responseHeaders.getOnPreResponseHandler(app as any);
        const height = 2346;
        getLastHeight.mockReturnValueOnce(height);

        const request = {
            query: {},
            response: { headers: {} },
        };

        const h = {
            continue: Symbol,
        };

        const ret = onPreResponse(request, h);

        expect(request.response.headers["X-Block-Height"]).toEqual(height);

        expect(ret).toBe(h.continue);
    });

    it("should add header X-Block-Height to response.output headers when response is error", () => {
        const onPreResponse = responseHeaders.getOnPreResponseHandler(app as any);
        const height = 2346;
        getLastHeight.mockReturnValueOnce(height);

        const request = {
            query: {},
            response: { headers: {}, isBoom: true, output: { headers: undefined } },
        };

        const h = {
            continue: Symbol,
        };

        const ret = onPreResponse(request, h);

        expect(request.response.output.headers["X-Block-Height"]).toEqual(height);

        expect(ret).toBe(h.continue);
    });
});
