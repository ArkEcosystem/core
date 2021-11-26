import Hapi from "@hapi/hapi";
import { dotSeparatedQuery } from "@packages/core-api/src/plugins/dot-separated-query";

describe("dotSeparatedQuery.register", () => {
    it("should register onRequest extension", () => {
        const server: Partial<Hapi.Server> = {
            ext: jest.fn(),
        };

        dotSeparatedQuery.register(server as Hapi.Server);

        expect(server.ext).toBeCalledWith("onRequest", dotSeparatedQuery.onRequest);
    });
});

describe("dotSeparatedQuery.onRequest", () => {
    it("should replace query object", () => {
        const request: Partial<Hapi.Request> = {
            query: {
                "balance.from": "100",
                "balance.to": "200",
            },
        };

        const h: Partial<Hapi.ResponseToolkit> = {
            continue: Symbol(),
        };

        const ret = dotSeparatedQuery.onRequest(request as Hapi.Request, h as Hapi.ResponseToolkit);

        expect(request.query).toEqual({
            balance: { from: "100", to: "200" },
        });

        expect(ret).toBe(h.continue);
    });
});
