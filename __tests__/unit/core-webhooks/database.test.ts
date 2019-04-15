import "jest-extended";

process.env.CORE_PATH_CACHE = process.env.HOME;

import { database } from "../../../packages/core-webhooks/src/database";
import { IWebhook } from "../../../packages/core-webhooks/src/interfaces";

const dummyWebhook: IWebhook = {
    id: "id",
    token: "token",
    event: "event",
    target: "target",
    enabled: true,
    conditions: [
        {
            key: "key",
            value: "value",
            condition: "condition",
        },
    ],
};

beforeEach(() => database.make());
afterEach(() => database.reset());

describe("Conditions - between", () => {
    it("should return all webhooks", () => {
        database.create(dummyWebhook);

        expect(database.all()).toHaveLength(1);
    });

    it("should find a webhook by its id", () => {
        const webhook = database.create(dummyWebhook);

        expect(database.findById(webhook.id)).toEqual(webhook);
    });

    it("should find webhooks by their event", () => {
        const webhook: IWebhook = database.create(dummyWebhook);

        const rows = database.findByEvent("event");

        expect(rows).toHaveLength(1);
        expect(rows[0]).toEqual(webhook);
    });

    it("should return an empty array if there are no webhooks for an event", () => {
        expect(database.findByEvent("event")).toHaveLength(0);
    });

    it("should create a new webhook", () => {
        const webhook: IWebhook = database.create(dummyWebhook);

        expect(database.create(webhook)).toEqual(webhook);
    });

    it("should update an existing webhook", () => {
        const webhook: IWebhook = database.create(dummyWebhook);
        const updated: IWebhook = database.update(webhook.id, dummyWebhook);

        expect(database.findById(webhook.id)).toEqual(updated);
    });

    it("should delete an existing webhook", () => {
        const webhook: IWebhook = database.create(dummyWebhook);

        expect(database.findById(webhook.id)).toEqual(webhook);

        database.destroy(webhook.id);

        expect(database.findById(webhook.id)).toBeUndefined();
    });
});
