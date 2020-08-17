import { dotQuery } from "../../../../packages/core-api/src/plugins/dot-query";

describe("dotQuery.register", () => {
    it("should register onRequest extension", () => {
        const server = {
            ext: jest.fn(),
        };

        dotQuery.register(server);

        expect(server.ext).toBeCalledWith("onRequest", dotQuery.onRequest);
    });
});

describe("dotQuery.onRequest", () => {
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

        const ret = dotQuery.onRequest(request, h);

        expect(request.query).toEqual({
            balance: { from: "100", to: "200" },
        });

        expect(ret).toBe(h.continue);
    });
});
