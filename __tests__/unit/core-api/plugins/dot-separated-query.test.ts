import { dotSeparatedQuery } from "@packages/core-api/src/plugins/dot-separated-query";

describe("dotSeparatedQuery.register", () => {
    it("should register onRequest extension", () => {
        const server = {
            ext: jest.fn(),
        };

        dotSeparatedQuery.register(server);

        expect(server.ext).toBeCalledWith("onRequest", dotSeparatedQuery.onRequest);
    });
});

describe("dotSeparatedQuery.onRequest", () => {
    it("should replace query object", () => {
        const request = {
            query: {
                "balance.from": "100",
                "balance.to": "200",
            },
        };

        const h = {
            continue: Symbol,
        };

        const ret = dotSeparatedQuery.onRequest(request, h);

        expect(request.query).toEqual({
            balance: { from: "100", to: "200" },
        });

        expect(ret).toBe(h.continue);
    });
});
