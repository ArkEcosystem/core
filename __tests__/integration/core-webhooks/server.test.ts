import { ApplicationEvents } from "@arkecosystem/core-event-emitter";
import "jest-extended";
import { setUp, tearDown } from "./__support__/setup";
import * as utils from "./__support__/utils";

beforeAll(async () => {
    await setUp();
});

afterAll(async () => {
    await tearDown();
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

function createWebhook(data?: any) {
    return utils.request("POST", "webhooks", data || postData);
}

describe("API 2.0 - Webhooks", () => {
    it("should GET all the webhooks", async () => {
        const response = await utils.request("GET", "webhooks");

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

        const response = await utils.request("GET", `webhooks/${webhook.body.data.id}`);
        utils.expectSuccessful(response);
        utils.expectResource(response);

        delete webhook.body.data.token;

        expect(response.body.data).toEqual(webhook.body.data);
    });

    it("should PUT a webhook by the given id", async () => {
        const webhook = await createWebhook();

        const response = await utils.request("PUT", `webhooks/${webhook.body.data.id}`, postData);
        utils.expectStatus(response, 204);
    });

    it("should DELETE a webhook by the given id", async () => {
        const webhook = await createWebhook();

        const response = await utils.request("DELETE", `webhooks/${webhook.body.data.id}`);
        utils.expectStatus(response, 204);
    });
});
