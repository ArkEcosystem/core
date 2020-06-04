import "jest-extended";

import { Container, Utils } from "@packages/core-kernel";
import { HttpOptions, HttpResponse } from "@packages/core-kernel/src/utils";
import { Sandbox } from "@packages/core-test-framework";
import * as coditions from "@packages/core-webhooks/src/conditions";
import { Database } from "@packages/core-webhooks/src/database";
import { WebhookEvent } from "@packages/core-webhooks/src/events";
import { Identifiers } from "@packages/core-webhooks/src/identifiers";
import { Webhook } from "@packages/core-webhooks/src/interfaces";
import { Listener } from "@packages/core-webhooks/src/listener";
import { dirSync, setGracefulCleanup } from "tmp";

import { dummyWebhook } from "./__fixtures__/assets";

let sandbox: Sandbox;
let database: Database;
let listener: Listener;
let webhook: Webhook;

const logger = {
    debug: jest.fn(),
    error: jest.fn(),
};

const mockEventDispatcher = {
    dispatch: jest.fn(),
};

let spyOnPost: jest.SpyInstance;

const expectFinishedEventData = () => {
    return expect.objectContaining({
        executionTime: expect.toBeNumber(),
        webhook: expect.toBeObject(),
        payload: expect.anything(),
    });
};

const expectFailedEventData = () => {
    return expect.objectContaining({
        executionTime: expect.toBeNumber(),
        webhook: expect.toBeObject(),
        payload: expect.anything(),
        error: expect.toBeObject(),
    });
};

beforeEach(() => {
    sandbox = new Sandbox();
    sandbox.app.bind("path.cache").toConstantValue(dirSync().name);

    sandbox.app.bind(Container.Identifiers.EventDispatcherService).toConstantValue(mockEventDispatcher);
    sandbox.app.bind<Database>(Identifiers.Database).to(Database).inSingletonScope();

    sandbox.app.bind(Container.Identifiers.LogService).toConstantValue(logger);

    database = sandbox.app.get<Database>(Identifiers.Database);
    database.boot();

    listener = sandbox.app.resolve<Listener>(Listener);

    webhook = Object.assign({}, dummyWebhook);

    spyOnPost = jest
        .spyOn(Utils.http, "post")
        .mockImplementation(async (url: string, opts?: HttpOptions | undefined) => {
            return {
                statusCode: 200,
            } as HttpResponse;
        });
});

afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
});

afterAll(() => setGracefulCleanup());

describe("Listener", () => {
    describe("broadcast", () => {
        it("should broadcast to registered webhooks", async () => {
            database.create(webhook);

            await listener.handle({ name: "event", data: "dummy_data" });

            expect(spyOnPost).toHaveBeenCalled();
            expect(logger.debug).toHaveBeenCalled();

            expect(mockEventDispatcher.dispatch).toHaveBeenCalledTimes(1);
            expect(mockEventDispatcher.dispatch).toHaveBeenCalledWith(
                WebhookEvent.Broadcasted,
                expectFinishedEventData(),
            );
        });

        it("should log error if broadcast is not successful", async () => {
            database.create(webhook);

            const spyOnPost = jest
                .spyOn(Utils.http, "post")
                .mockImplementation(async (url: string, opts?: HttpOptions | undefined) => {
                    throw new Error();
                });

            await listener.handle({ name: "event", data: "dummy_data" });

            expect(spyOnPost).toHaveBeenCalled();
            expect(logger.error).toHaveBeenCalled();

            expect(mockEventDispatcher.dispatch).toHaveBeenCalledTimes(1);
            expect(mockEventDispatcher.dispatch).toHaveBeenCalledWith(WebhookEvent.Failed, expectFailedEventData());
        });
    });

    describe("webhooks", () => {
        it("should not broadcast if webhook is disabled", async () => {
            webhook.enabled = false;
            database.create(webhook);

            await listener.handle({ name: "event", data: "dummy_data" });

            expect(spyOnPost).toHaveBeenCalledTimes(0);
        });

        it("should not broadcast if event is webhook event", async () => {
            database.create(webhook);

            await listener.handle({ name: WebhookEvent.Broadcasted, data: "dummy_data" });

            expect(spyOnPost).toHaveBeenCalledTimes(0);
        });

        it("should broadcast if webhook condition is satisfied", async () => {
            webhook.conditions = [
                {
                    key: "test",
                    value: 1,
                    condition: "eq",
                },
            ];
            database.create(webhook);

            await listener.handle({ name: "event", data: { test: 1 } });

            expect(spyOnPost).toHaveBeenCalledTimes(1);

            expect(mockEventDispatcher.dispatch).toHaveBeenCalledTimes(1);
            expect(mockEventDispatcher.dispatch).toHaveBeenCalledWith(
                WebhookEvent.Broadcasted,
                expectFinishedEventData(),
            );
        });

        it("should not broadcast if webhook condition is not satisfied", async () => {
            webhook.conditions = [
                {
                    key: "test",
                    value: 1,
                    condition: "eq",
                },
            ];
            database.create(webhook);

            await listener.handle({ name: "event", data: { test: 2 } });

            expect(spyOnPost).toHaveBeenCalledTimes(0);
        });

        it("should not broadcast if webhook condition throws error", async () => {
            const spyOnEq = jest.spyOn(coditions, "eq").mockImplementation((actual, expected) => {
                throw new Error();
            });

            webhook.conditions = [
                {
                    key: "test",
                    value: 1,
                    condition: "eq",
                },
            ];
            database.create(webhook);

            await listener.handle({ name: "event", data: { test: 2 } });

            expect(spyOnEq).toHaveBeenCalledTimes(1);
            expect(spyOnPost).toHaveBeenCalledTimes(0);
        });
    });
});
