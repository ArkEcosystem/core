import "jest-extended";

import { Container } from "@arkecosystem/core-kernel";
import { Sandbox } from "@packages/core-test-framework";
import { DatabaseService } from "@packages/core-watcher/src/database-service";
import { existsSync } from "fs-extra";
import { dirSync, setGracefulCleanup } from "tmp";

let sandbox: Sandbox;
let database: DatabaseService;
let storagePath: string;

beforeEach(() => {
    sandbox = new Sandbox();

    storagePath = dirSync().name + "/events.sqlite";

    sandbox.app.bind(Container.Identifiers.WatcherDatabaseService).to(DatabaseService).inSingletonScope();

    sandbox.app.bind(Container.Identifiers.PluginConfiguration).toConstantValue({
        getRequired: jest.fn().mockReturnValue(storagePath),
    });

    database = sandbox.app.get(Container.Identifiers.WatcherDatabaseService);
});

afterEach(() => {
    setGracefulCleanup();
});

describe("DatabaseService", () => {
    describe("Boot", () => {
        it("should boot and create file", async () => {
            database.boot();

            expect(existsSync(storagePath)).toBeTrue();
        });
    });

    describe("Dispose", () => {
        it("should dispose", async () => {
            database.boot();
            database.dispose();

            expect(() => {
                database.addEvent("dummy_event", { data: "dummy_data" });
            }).toThrowError();
        });
    });

    describe("Flush", () => {
        it("should dispose", async () => {
            database.boot();

            database.addEvent("dummy_event", { data: "dummy_data" });

            expect(database.getAllEvents().length).toBe(1);

            database.flush();

            expect(database.getAllEvents().length).toBe(0);
        });
    });

    describe("AddEvent", () => {
        it("should add event", async () => {
            database.boot();
            expect(existsSync(storagePath)).toBeTrue();

            database.addEvent("dummy_event", { data: "dummy_data" });

            const result = database.getAllEvents();

            expect(result).toBeArray();
            expect(result[0]).toMatchObject({
                id: 1,
                event: "dummy_event",
                data: { data: "dummy_data" },
            });

            expect(result[0].timestamp).toBeDefined();
        });
    });

    describe("Query", () => {
        beforeEach(() => {
            database.boot();

            for (let i = 0; i < 100; i++) {
                database.addEvent("dummy_event", { data: "dummy_data" });
                database.addEvent("another_dummy_event", { data: "another_dummy_data" });
            }
        });

        it("should return limit 10", async () => {
            const result = database.queryEvents();

            expect(result.total).toBe(200);
            expect(result.limit).toBe(10);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(10);
        });

        it("should return limit 10 with offset", async () => {
            const result = database.queryEvents({ offset: 10 });

            expect(result.total).toBe(200);
            expect(result.limit).toBe(10);
            expect(result.offset).toBe(10);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(10);
        });

        it("should return limit 20", async () => {
            const result = database.queryEvents({ limit: 20 });

            expect(result.total).toBe(200);
            expect(result.limit).toBe(20);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(20);
        });

        it("should return events with name", async () => {
            const result = database.queryEvents({ limit: 1000, event: "dummy_event" });

            expect(result.total).toBe(100);
            expect(result.limit).toBe(1000);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(100);
        });
    });
});
