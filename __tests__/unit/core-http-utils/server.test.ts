import { fileSync, setGracefulCleanup } from "tmp";
import TrailingSlash from "hapi-trailing-slash";

import { Server } from "@packages/core-http-utils/src/server";
import { Application } from "@packages/core-kernel/src/application";
import { Container, Identifiers } from "@packages/core-kernel/src/ioc";
import getPort from "get-port";

let app: Application;
let server: Server;
let logger;

beforeEach(() => {
    logger = { info: jest.fn(), notice: jest.fn() };

    app = new Application(new Container());
    app.bind(Identifiers.LogService).toConstantValue(logger);

    server = app.resolve(Server);
});

afterAll(() => setGracefulCleanup());

describe("Server", () => {
    it("should start a server", async () => {
        const info = jest.spyOn(logger, "info");

        const port: number = await getPort();

        await server.init("Jest", {
            host: "localhost",
            port,
        });

        await server.start();

        expect(info).toHaveBeenCalledWith(`Jest Server started at http://localhost:${port}`);

        const { result } = await server.inject("/");

        expect(result).toEqual({ data: "Hello World!" });

        info.mockReset();
    });

    it("should start a server with SSL", async () => {
        const info = jest.spyOn(logger, "info");

        const port: number = await getPort();

        await server.init("Jest", {
            host: "localhost",
            port,
            tls: { key: fileSync().name, cert: fileSync().name },
        });

        await server.start();

        expect(info).toHaveBeenCalledWith(`Jest Server started at https://localhost:${port}`);

        info.mockReset();
    });

    it("should fail to start the server", async () => {
        const info = jest.spyOn(logger, "info").mockImplementation(() => {
            throw new Error("unexpected error");
        });
        const terminate = jest.spyOn(app, "terminate").mockImplementation(undefined);

        await server.init("Jest", { host: "localhost" });
        await server.start();

        expect(info).toHaveBeenCalled();
        expect(terminate).toHaveBeenCalledWith("Failed to start Jest Server!");

        info.mockReset();
        terminate.mockReset();
    });

    it("should fail to stop the server", async () => {
        const info = jest.spyOn(logger, "info").mockImplementation(() => {
            throw new Error("unexpected error");
        });
        const terminate = jest.spyOn(app, "terminate").mockImplementation(undefined);

        await server.init("Jest", { host: "localhost" });
        await server.stop();

        expect(info).toHaveBeenCalled();
        expect(terminate).toHaveBeenCalledWith("Failed to stop Jest Server!");

        info.mockReset();
        terminate.mockReset();
    });

    it("should register a plugin", async () => {
        await server.init("Jest", { host: "localhost" });
        await server.stop();

        await server.register({
            plugin: TrailingSlash,
            options: { method: "remove" },
        });
    });

    it("should register a route", async () => {
        await server.init("Jest", { host: "localhost" });

        server.route({
            method: "GET",
            path: "/test",
            handler() {
                return { data: "Hello World!" };
            },
        });
    });

    it("should inject a request", async () => {
        await server.init("Jest", { host: "localhost" });

        server.route({
            method: "GET",
            path: "/inject",
            handler() {
                return "Success!";
            },
        });

        const { result } = await server.inject("/inject");

        expect(result).toBe("Success!");
    });
});
