import "jest-extended";

import { app } from "@arkecosystem/core-container";
import { ApplicationEvents } from "@arkecosystem/core-event-emitter";
import { Server } from "http";
import { tmpdir } from "os";
import { database } from "../../../packages/core-webhooks/src/database";
import { startServer } from "../../../packages/core-webhooks/src/server";

const postData = {
    event: ApplicationEvents.BlockForged,
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

const request = async (server, method, path, payload = {}) => {
    const response = await server.inject({ method, url: `http://localhost:4004/api/${path}`, payload });

    return { body: response.result, status: response.statusCode };
};

const createWebhook = (server, data?: any) => request(server, "POST", "webhooks", data || postData);

let server: Server;
beforeAll(async () => {
    process.env.CORE_PATH_CACHE = tmpdir();

    app.resolvePlugin = jest.fn().mockReturnValue(console);

    database.make();

    server = await startServer({
        host: "0.0.0.0",
        port: 4004,
        whitelist: ["127.0.0.1", "::ffff:127.0.0.1"],
    });
});

describe("API 2.0 - Webhooks", () => {
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
            event: ApplicationEvents.BlockForged,
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
            event: ApplicationEvents.BlockForged,
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
