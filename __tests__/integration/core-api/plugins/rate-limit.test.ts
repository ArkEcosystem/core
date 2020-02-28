import Hapi from "@hapi/hapi";
import plugin from "@packages/core-api/src/plugins/rate-limit";

let server: Hapi.Server;

beforeEach(() => {
    server = new Hapi.Server({ debug: { request: ["*"] } });

    server.route({
        method: "GET",
        path: "/",
        handler: () => [],
    });
});

describe("Rate Limiter", () => {
    it("should receive status code 200 (OK)", async () => {
        await server.register({ plugin, options: { points: 5, duration: 30 } });

        const response = await server.inject({ method: "GET", url: "/" });

        expect(response.statusCode).toBe(200);
    });

    it("should receive status code 429 (Too Many Requests)", async () => {
        await server.register({ plugin, options: { points: 1, duration: 5, whitelist: [] } });

        await server.inject({ method: "GET", url: "/" });
        const response = await server.inject({ method: "GET", url: "/" });

        expect(response.statusCode).toBe(429);
    });

    it("should received status code 200 for whitelisted IPs (OK)", async () => {
        await server.register({ plugin, options: { points: 5, duration: 30, whitelist: ["127.*"], blacklist: [] } });

        const response = await server.inject({ method: "GET", url: "/" });

        expect(response.statusCode).toBe(200);
    });

    it("should received status code 429 for blacklisted IPs (Forbidden)", async () => {
        await server.register({ plugin, options: { points: 5, duration: 30, whitelist: [], blacklist: ["127.*"] } });

        const response = await server.inject({ method: "GET", url: "/" });

        expect(response.statusCode).toBe(429);
    });
});
