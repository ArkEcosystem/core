import "jest-extended";

import { Application } from "@packages/core-kernel/src/application";
import { Container, interfaces } from "@packages/core-kernel/src/ioc";
import { Database } from "@packages/core-webhooks/src/database";
import { Webhook } from "@packages/core-webhooks/src/interfaces";
import { dirSync, setGracefulCleanup } from "tmp";

const dummyWebhook: Webhook = {
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

let app: Application;
let container: interfaces.Container;
let database: Database;

beforeEach(() => {
    container = new Container();
    container.snapshot();

    app = new Application(container);
    app.bind("path.cache").toConstantValue(dirSync().name);

    app.bind<Database>("webhooks.db")
        .to(Database)
        .inSingletonScope();

    database = app.get<Database>("webhooks.db");
    database.init();
});

afterEach(() => container.restore());

afterAll(() => setGracefulCleanup());

describe("Database", () => {
    it("should return all webhooks", () => {
        database.create(dummyWebhook);

        expect(database.all()).toHaveLength(1);
    });

    it("should find a webhook by its id", () => {
        const webhook = database.create(dummyWebhook);

        expect(database.findById(webhook.id)).toEqual(webhook);
    });

    it("should find webhooks by their event", () => {
        const webhook: Webhook = database.create(dummyWebhook);

        const rows = database.findByEvent("event");

        expect(rows).toHaveLength(1);
        expect(rows[0]).toEqual(webhook);
    });

    it("should return an empty array if there are no webhooks for an event", () => {
        expect(database.findByEvent("event")).toHaveLength(0);
    });

    it("should create a new webhook", () => {
        const webhook: Webhook = database.create(dummyWebhook);

        expect(database.create(webhook)).toEqual(webhook);
    });

    it("should update an existing webhook", () => {
        const webhook: Webhook = database.create(dummyWebhook);
        const updated: Webhook = database.update(webhook.id, dummyWebhook);

        expect(database.findById(webhook.id)).toEqual(updated);
    });

    it("should delete an existing webhook", () => {
        const webhook: Webhook = database.create(dummyWebhook);

        expect(database.findById(webhook.id)).toEqual(webhook);

        database.destroy(webhook.id);

        expect(database.findById(webhook.id)).toBeUndefined();
    });
});
