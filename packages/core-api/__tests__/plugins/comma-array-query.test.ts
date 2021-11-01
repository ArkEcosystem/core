import { commaArrayQuery } from "@packages/core-api/src/plugins/comma-array-query";

describe("commaArrayQuery.register", () => {
    it("should register onRequest extension", () => {
        const server = {
            ext: jest.fn(),
        };

        commaArrayQuery.register(server);

        expect(server.ext).toBeCalledWith("onRequest", commaArrayQuery.onRequest);
    });
});

describe("commaArrayQuery.onRequest", () => {
    it("should replace comma separated query parameter by array", () => {
        const addresses = [
            "AXGc1bgU3v3rHmx9WVkUUHLA6gbzh8La7V",
            "AQvWbCAXbBnY9fHpgNrcLZ99hYfDifH4Hs",
            "ATKegneyu9Fkoj5FxiJ3biup8xv8zM34M3",
        ];
        const request = {
            query: {
                address: addresses.join(","),
            },
        };

        const h = {
            continue: Symbol,
        };

        const ret = commaArrayQuery.onRequest(request, h);

        expect(request.query).toEqual({
            address: addresses,
        });

        expect(ret).toBe(h.continue);
    });

    it("should leave as-is query parameter without comma", () => {
        const address = "AXGc1bgU3v3rHmx9WVkUUHLA6gbzh8La7V";
        const request = {
            query: {
                address,
            },
        };

        const h = {
            continue: Symbol,
        };

        const ret = commaArrayQuery.onRequest(request, h);

        expect(request.query).toEqual({
            address,
        });

        expect(ret).toBe(h.continue);
    });
});
