import "jest-extended";

import { Application } from "@packages/core-kernel/src/application";
import { Container, Utils } from "@packages/core-kernel";
import { Database } from "@packages/core-webhooks/src/database";
import { Identifiers } from "@packages/core-webhooks/src/identifiers";
import { Listener } from "@packages/core-webhooks/src/listener";
import { Webhook } from "@arkecosystem/core-webhooks/src/interfaces";
import { dirSync, setGracefulCleanup } from "tmp";
import { HttpOptions, HttpResponse } from "@arkecosystem/core-kernel/src/utils";
import { dummyWebhook } from "./__fixtures__/assets";
import * as coditions from "@arkecosystem/core-webhooks/src/conditions";

let app: Application;
let database: Database;
let listener: Listener;
let webhook: Webhook;

const logger = {
    debug: jest.fn(),
    error: jest.fn(),
};

let spyOnPost: jest.SpyInstance;

beforeEach(() => {
    app = new Application(new Container.Container());
    app.bind("path.cache").toConstantValue(dirSync().name);

    app.bind<Database>(Identifiers.Database)
        .to(Database)
        .inSingletonScope();

    app.bind(Container.Identifiers.LogService)
        .toConstantValue(logger);

    database = app.get<Database>(Identifiers.Database);
    database.boot();

    listener = app.resolve<Listener>(Listener);

    webhook = Object.assign({}, dummyWebhook);

    spyOnPost = jest.spyOn(Utils.http, "post").mockImplementation(async (url: string,  opts?: HttpOptions | undefined) => {
        return {
            statusCode: 200
        } as HttpResponse;
    });
});

afterEach(() => {
    jest.resetAllMocks();
});

afterAll(() => setGracefulCleanup());

describe("Listener", () => {
    describe("broadcast", () => {
        it("should broadcast to registered webhooks", async () => {
            database.create(webhook);

            await listener.handle({ name: "event", data: "dummy_data"});

            expect(spyOnPost).toHaveBeenCalled();
            expect(logger.debug).toHaveBeenCalled();
        });

        it("should log error if broadcast is not successful", async () => {
            database.create(webhook);

            const spyOnPost = jest.spyOn(Utils.http, "post").mockImplementation(async (url: string,  opts?: HttpOptions | undefined) => {
                throw new Error();
            });

            await listener.handle({ name: "event", data: "dummy_data"});

            expect(spyOnPost).toHaveBeenCalled();
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe("webhooks", () => {
        it("should not broadcast if webhook is disabled", async () => {
            webhook.enabled = false;
            database.create(webhook);

            await listener.handle({ name: "event", data: "dummy_data" });

            expect(spyOnPost).toHaveBeenCalledTimes(0);
        });

        it("should broadcast if webhook condition is satisfied", async () => {
            webhook.conditions = [
                {
                    key: "test",
                    value: 1,
                    condition: "eq",
                }
            ];
            database.create(webhook);

            await listener.handle({ name: "event", data: { test: 1 } });

            expect(spyOnPost).toHaveBeenCalledTimes(1);
        });

        it("should not broadcast if webhook condition is not satisfied", async () => {
            webhook.conditions = [
                {
                    key: "test",
                    value: 1,
                    condition: "eq",
                }
            ];
            database.create(webhook);

            await listener.handle({ name: "event", data: { test: 2 } });

            expect(spyOnPost).toHaveBeenCalledTimes(0);
        });

        it("should not broadcast if webhook condition throws error", async () => {
            let spyOnEq = jest.spyOn(coditions, "eq").mockImplementation((actual, expected) => {
                throw new Error();
            });

            webhook.conditions = [
                {
                    key: "test",
                    value: 1,
                    condition: "eq",
                }
            ];
            database.create(webhook);

            await listener.handle({ name: "event", data: { test: 2 } });

            expect(spyOnEq).toHaveBeenCalledTimes(1);
            expect(spyOnPost).toHaveBeenCalledTimes(0);
        });
    });
});
