import "jest-extended";

import { Container } from "@arkecosystem/core-kernel";
import { Listener } from "@arkecosystem/core-manager/src/listener";
import { Sandbox } from "@packages/core-test-framework";

let sandbox: Sandbox;
let listener: Listener;
const mockDatabase = {
    add: jest.fn(),
};

let handler;

const mockEventDispatcher = {
    listen: jest.fn().mockImplementation((event, cb) => {
        handler = cb;
    }),
};

const mockWatchDefaults = {
    blocks: true,
    errors: true,
    logs: true,
    queries: true,
    queues: true,
    rounds: true,
    schedules: true,
    transactions: true,
    wallets: true,
    webhooks: true,
};

beforeEach(() => {
    sandbox = new Sandbox();

    sandbox.app.bind(Container.Identifiers.PluginConfiguration).toConstantValue({
        getRequired: jest.fn().mockImplementation((name) =>
        {
            const field = name.split(".")[2];
            return mockWatchDefaults[field];
        }),
    });

    sandbox.app.bind(Container.Identifiers.WatcherDatabaseService).toConstantValue(mockDatabase);
    sandbox.app.bind(Container.Identifiers.EventDispatcherService).toConstantValue(mockEventDispatcher);
    sandbox.app.bind(Container.Identifiers.WatcherEventListener).to(Listener).inSingletonScope();

    listener = sandbox.app.get(Container.Identifiers.WatcherEventListener);
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("Listener", () => {
    describe("Boot", () => {
        it("should boot and save event on emit", async () => {
            listener.boot();

            handler.handle({ name: "dummy_event", data: "dummy_data" });

            expect(mockDatabase.add).toHaveBeenCalledTimes(1);
        });
    });

    describe("Filter - block", () => {
        it("should pass", async () => {
            listener.boot();
            handler.handle({ name: "block.", data: "dummy_data" });
            expect(mockDatabase.add).toHaveBeenCalledTimes(1);
        });

        it("should not pass", async () => {
            mockWatchDefaults.blocks = false;
            listener.boot();
            handler.handle({ name: "block.", data: "dummy_data" });
            expect(mockDatabase.add).toHaveBeenCalledTimes(0);
        });
    });

    describe("Filter - log error", () => {
        it("should pass", async () => {
            listener.boot();
            handler.handle({ name: "log.error", data: "dummy_data" });
            expect(mockDatabase.add).toHaveBeenCalledTimes(1);
        });

        it("should not pass", async () => {
            mockWatchDefaults.errors = false;
            listener.boot();
            handler.handle({ name: "log.error", data: "dummy_data" });
            expect(mockDatabase.add).toHaveBeenCalledTimes(0);
        });
    });

    describe("Filter - queue", () => {
        it("should pass", async () => {
            listener.boot();
            handler.handle({ name: "queue.", data: "dummy_data" });
            expect(mockDatabase.add).toHaveBeenCalledTimes(1);
        });

        it("should not pass", async () => {
            mockWatchDefaults.queues = false;
            listener.boot();
            handler.handle({ name: "queue.", data: "dummy_data" });
            expect(mockDatabase.add).toHaveBeenCalledTimes(0);
        });
    });

    describe("Filter - round", () => {
        it("should pass", async () => {
            listener.boot();
            handler.handle({ name: "round.", data: "dummy_data" });
            expect(mockDatabase.add).toHaveBeenCalledTimes(1);
        });

        it("should not pass", async () => {
            mockWatchDefaults.rounds = false;
            listener.boot();
            handler.handle({ name: "round.", data: "dummy_data" });
            expect(mockDatabase.add).toHaveBeenCalledTimes(0);
        });
    });

    describe("Filter - schedule", () => {
        it("should pass", async () => {
            listener.boot();
            handler.handle({ name: "schedule.", data: "dummy_data" });
            expect(mockDatabase.add).toHaveBeenCalledTimes(1);
        });

        it("should not pass", async () => {
            mockWatchDefaults.schedules = false;
            listener.boot();
            handler.handle({ name: "schedule.", data: "dummy_data" });
            expect(mockDatabase.add).toHaveBeenCalledTimes(0);
        });
    });

    describe("Filter - transaction", () => {
        it("should pass", async () => {
            listener.boot();
            handler.handle({ name: "transaction.", data: "dummy_data" });
            expect(mockDatabase.add).toHaveBeenCalledTimes(1);
        });

        it("should not pass", async () => {
            mockWatchDefaults.transactions = false;
            listener.boot();
            handler.handle({ name: "transaction.", data: "dummy_data" });
            expect(mockDatabase.add).toHaveBeenCalledTimes(0);
        });
    });

    describe("Filter - webhooks", () => {
        it("should pass", async () => {
            listener.boot();
            handler.handle({ name: "webhooks.", data: "dummy_data" });
            expect(mockDatabase.add).toHaveBeenCalledTimes(1);
        });

        it("should not pass", async () => {
            mockWatchDefaults.webhooks = false;
            listener.boot();
            handler.handle({ name: "webhooks.", data: "dummy_data" });
            expect(mockDatabase.add).toHaveBeenCalledTimes(0);
        });
    });
});
