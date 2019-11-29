import Hapi from "@hapi/hapi";
import { trailingSlash } from "../../../../../packages/core-http-utils/src/plugins/trailing-slash";

let server: Hapi.Server;

beforeAll(async () => {
    server = new Hapi.Server({ host: "0.0.0.0" });

    await server.register(trailingSlash);

    server.route({
        method: "GET",
        path: "/api/blocks",
        handler: () => ({ key: "value" }),
    });

    await server.start();
});

afterAll(async () => server.stop());

describe("Version", () => {
    it("should return status code 200 without any trailing slashes", async () => {
        const response = await server.inject({ method: "GET", url: "/api/blocks" });

        expect(response.statusCode).toBe(200);
        expect(response.payload).toEqual('{"key":"value"}');
    });

    it("should return status code 301 with a single trailing slash", async () => {
        const response = await server.inject({ method: "GET", url: "/api/blocks/" });

        expect(response.statusCode).toBe(301);
    });

    it("should return status code 301 with multiple trailing slashes", async () => {
        const response = await server.inject({ method: "GET", url: "/api/blocks//////////////////////" });

        expect(response.statusCode).toBe(301);
    });

    it("should return status code 301 with multiple trailing slashes and query parameters", async () => {
        const response = await server.inject({ method: "GET", url: "/api/blocks//////////////////////?page=1" });

        expect(response.statusCode).toBe(301);
    });

    it("should return status code 404 with for multiple slashes within the path", async () => {
        const response = await server.inject({ method: "GET", url: "/api/blocks//////salkdjhlksjad" });

        expect(response.statusCode).toBe(404);
    });
});
