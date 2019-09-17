import "jest-extended";

import { Application } from "@packages/core-kernel/src/application";
import { Container, Identifiers, interfaces } from "@packages/core-kernel/src/ioc";
import { Enums } from "@packages/core-kernel/src";
import { Database } from "@packages/core-webhooks/src/database";
import { dirSync, setGracefulCleanup } from "tmp";
import { startServer } from "@packages/core-webhooks/src/server";
import { Server } from "@packages/core-webhooks/src/server/hapi";

const postData = {
    event: Enums.Events.State.BlockForged,
    target: "https://httpbin.org/post",
    enabled: true,
    conditions: [
        {
            key: "generatorPublicKey",
            condition: "eq",
            value: "test-generator",
        },
        {
            key: "fee",
            condition: "gte",
            value: "123",
        },
    ],
};

const request = async (server: Server, method, path, payload = {}) => {
    const response = await server.inject({ method, url: `http://localhost:4004/api/${path}`, payload });

    return { body: response.result as any, status: response.statusCode };
};

const createWebhook = (server, data?: any) => request(server, "POST", "webhooks", data || postData);

let server: Server;
let container: interfaces.Container;

beforeEach(async () => {
    container = new Container();

    const app: Application = new Application(container);
    app.bind(Identifiers.LogService).toConstantValue({ info: jest.fn(), debug: jest.fn() });
    app.bind("path.cache").toConstantValue(dirSync().name);

    app.bind<Database>("webhooks.db")
        .to(Database)
        .inSingletonScope();

    app.get<Database>("webhooks.db").init();

    container.snapshot();

    server = await startServer(app, {
        host: "0.0.0.0",
        port: 4004,
        whitelist: ["127.0.0.1", "::ffff:127.0.0.1"],
    });
});

afterEach(async () => {
    container.restore();

    await server.stop();
});

afterAll(() => setGracefulCleanup());

describe("Webhooks", () => {
    it("should GET all the webhooks", async () => {
        const response = await request(server, "GET", "webhooks");

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should POST a new webhook with a simple condition", async () => {
        const response = await createWebhook(server);
        expect(response.status).toBe(201);
        expect(response.body.data).toBeObject();
    });

    it("should POST a new webhook with a complex condition", async () => {
        const response = await createWebhook(server, {
            event: Enums.Events.State.BlockForged,
            target: "https://httpbin.org/post",
            enabled: true,
            conditions: [
                {
                    key: "fee",
                    condition: "between",
                    value: {
                        min: 1,
                        max: 2,
                    },
                },
            ],
        });
        expect(response.status).toBe(201);
        expect(response.body.data).toBeObject();
    });

    it("should POST a new webhook with an empty array as condition", async () => {
        const response = await createWebhook(server, {
            event: Enums.Events.State.BlockForged,
            target: "https://httpbin.org/post",
            enabled: true,
            conditions: [],
        });
        expect(response.status).toBe(201);
        expect(response.body.data).toBeObject();
    });

    it("should GET a webhook by the given id", async () => {
        const { body } = await createWebhook(server);

        const response = await request(server, "GET", `webhooks/${body.data.id}`);
        expect(response.status).toBe(200);
        expect(response.body.data).toBeObject();

        delete body.data.token;

        expect(response.body.data).toEqual(body.data);
    });

    it("should fail to GET a webhook by the given id", async () => {
        expect((await request(server, "GET", `webhooks/123`)).status).toBe(404);
    });

    it("should PUT a webhook by the given id", async () => {
        const { body } = await createWebhook(server);

        expect((await request(server, "PUT", `webhooks/${body.data.id}`, postData)).status).toBe(204);
    });

    it("should fail to PUT a webhook by the given id", async () => {
        expect((await request(server, "PUT", `webhooks/123`, postData)).status).toBe(404);
    });

    it("should DELETE a webhook by the given id", async () => {
        const { body } = await createWebhook(server);

        expect((await request(server, "DELETE", `webhooks/${body.data.id}`)).status).toBe(204);
    });

    it("should fail to DELETE a webhook by the given id", async () => {
        expect((await request(server, "DELETE", `webhooks/123`)).status).toBe(404);
    });
});
