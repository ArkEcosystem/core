import "jest-extended";

import { app } from "@arkecosystem/core-container";
import { ApplicationEvents } from "@arkecosystem/core-event-emitter";
import { Server } from "http";
import { tmpdir } from "os";
import { database } from "../../../packages/core-webhooks/src/database";
import { startServer } from "../../../packages/core-webhooks/src/server";
import * as utils from "./__support__/utils";

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

const createWebhook = (data?: any) => utils.request(server, "POST", "webhooks", data || postData);

describe("API 2.0 - Webhooks", () => {
    it("should GET all the webhooks", async () => {
        const response = await utils.request(server, "GET", "webhooks");

        utils.expectSuccessful(response);
        utils.expectCollection(response);
    });

    it("should POST a new webhook with a simple condition", async () => {
        const response = await createWebhook();
        utils.expectSuccessful(response, 201);
        utils.expectResource(response);
    });

    it("should POST a new webhook with a complex condition", async () => {
        const response = await createWebhook({
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
        utils.expectSuccessful(response, 201);
        utils.expectResource(response);
    });

    it("should POST a new webhook with an empty array as condition", async () => {
        const response = await createWebhook({
            event: ApplicationEvents.BlockForged,
            target: "https://httpbin.org/post",
            enabled: true,
            conditions: [],
        });
        utils.expectSuccessful(response, 201);
        utils.expectResource(response);
    });

    it("should GET a webhook by the given id", async () => {
        const webhook = await createWebhook();

        const response = await utils.request(server, "GET", `webhooks/${webhook.body.data.id}`);
        utils.expectSuccessful(response);
        utils.expectResource(response);

        delete webhook.body.data.token;

        expect(response.body.data).toEqual(webhook.body.data);
    });

    it("should fail to GET a webhook by the given id", async () => {
        utils.expectStatus(await utils.request(server, "GET", `webhooks/123`), 404);
    });

    it("should PUT a webhook by the given id", async () => {
        const webhook = await createWebhook();

        const response = await utils.request(server, "PUT", `webhooks/${webhook.body.data.id}`, postData);
        utils.expectStatus(response, 204);
    });

    it("should fail to PUT a webhook by the given id", async () => {
        utils.expectStatus(await utils.request(server, "PUT", `webhooks/123`, postData), 404);
    });

    it("should DELETE a webhook by the given id", async () => {
        const webhook = await createWebhook();

        const response = await utils.request(server, "DELETE", `webhooks/${webhook.body.data.id}`);
        utils.expectStatus(response, 204);
    });

    it("should fail to DELETE a webhook by the given id", async () => {
        utils.expectStatus(await utils.request(server, "DELETE", `webhooks/123`), 404);
    });
});
