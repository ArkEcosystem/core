import "jest-extended";

import { EventsDatabaseService } from "@arkecosystem/core-manager/src/database/events-database-service";
import { existsSync } from "fs-extra";
import { dirSync, setGracefulCleanup } from "tmp";

let database: EventsDatabaseService;
let storagePath: string;

beforeEach(() => {
    storagePath = dirSync().name + "/events.sqlite";
    database = new EventsDatabaseService(storagePath);
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

        // it("should boot without watcher storage in defaults", async () => {
        //     // @ts-ignore
        //     storagePath = undefined;
        //
        //     database.boot();
        // });
    });

    describe("Dispose", () => {
        it("should dispose", async () => {
            database.boot();
            database.dispose();

            expect(() => {
                database.add("dummy_event", { data: "dummy_data" });
            }).toThrowError();
        });
    });

    describe("Flush", () => {
        it("should dispose", async () => {
            database.boot();

            database.add("dummy_event", { data: "dummy_data" });

            expect(database.getAll().length).toBe(1);

            database.flush();

            expect(database.getAll().length).toBe(0);
        });
    });

    describe("AddEvent", () => {
        it("should add event", async () => {
            database.boot();
            expect(existsSync(storagePath)).toBeTrue();

            database.add("dummy_event", { data: "dummy_data" });

            const result = database.getAll();

            expect(result).toBeArray();
            expect(result[0]).toMatchObject({
                id: 1,
                event: "dummy_event",
                data: { data: "dummy_data" },
            });

            expect(result[0].timestamp).toBeDefined();
        });

        it("should add event with empty data", async () => {
            database.boot();
            expect(existsSync(storagePath)).toBeTrue();

            database.add("dummy_event", undefined);

            const result = database.getAll();

            expect(result).toBeArray();
            expect(result[0]).toMatchObject({
                id: 1,
                event: "dummy_event",
                data: {},
            });

            expect(result[0].timestamp).toBeDefined();
        });
    });

    describe("Query", () => {
        beforeEach(() => {
            database.boot();

            for (let i = 0; i < 100; i++) {
                database.add("dummy_event", { data: "dummy_data" });
                database.add("another_dummy_event", { data: "another_dummy_data" });
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
            const result = database.queryEvents({ $offset: 10 });

            expect(result.total).toBe(200);
            expect(result.limit).toBe(10);
            expect(result.offset).toBe(10);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(10);
        });

        it("should return limit 20", async () => {
            const result = database.queryEvents({ $limit: 20 });

            expect(result.total).toBe(200);
            expect(result.limit).toBe(20);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(20);
        });

        it("should return events with name", async () => {
            const result = database.queryEvents({ $limit: 1000, event: "dummy_event" });

            expect(result.total).toBe(100);
            expect(result.limit).toBe(1000);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(100);
        });

        it("should not return events if searching by number", async () => {
            const result = database.queryEvents({ $limit: 1000, event: 1 });

            expect(result.total).toBe(0);
            expect(result.limit).toBe(1000);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(0);
        });
    });

    describe("Query JSON", () => {
        beforeEach(() => {
            database.boot();

            database.add("dummy_event", { size: 1, name: "1_dummy_event" });
            database.add("dummy_event", { size: 2, name: "2_dummy_event" });
            database.add("dummy_event", { size: 3, name: "3_dummy_event" });
            database.add("dummy_event", { size: 4, name: "4_dummy_event" });
            database.add("dummy_event", { size: 5, name: "5_dummy_event" });
        });

        it("should chose $eq by default", async () => {
            const result = database.queryEvents({ data: { size: 1 } });

            expect(result.total).toBe(1);
            expect(result.limit).toBe(10);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(1);
        });

        it("should use $eq on string", async () => {
            const result = database.queryEvents({ data: { name: { $eq: "1_dummy_event" } } });

            expect(result.total).toBe(1);
            expect(result.limit).toBe(10);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(1);
        });

        it("should use $ne", async () => {
            const result = database.queryEvents({ data: { size: { $ne: 3 } } });

            expect(result.total).toBe(4);
            expect(result.limit).toBe(10);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(4);
        });

        it("should use $like on string", async () => {
            const result = database.queryEvents({ data: { name: { $like: "1_%" } } });

            expect(result.total).toBe(1);
            expect(result.limit).toBe(10);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(1);
        });

        it("should use $lt", async () => {
            const result = database.queryEvents({ data: { size: { $lt: 2 } } });

            expect(result.total).toBe(1);
            expect(result.limit).toBe(10);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(1);
        });

        it("should use $lte", async () => {
            const result = database.queryEvents({ data: { size: { $lte: 2 } } });

            expect(result.total).toBe(2);
            expect(result.limit).toBe(10);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(2);
        });

        it("should use $gt", async () => {
            const result = database.queryEvents({ data: { size: { $gt: 4 } } });

            expect(result.total).toBe(1);
            expect(result.limit).toBe(10);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(1);
        });

        it("should use $gte", async () => {
            const result = database.queryEvents({ data: { size: { $gte: 4 } } });

            expect(result.total).toBe(2);
            expect(result.limit).toBe(10);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(2);
        });

        it("should use $gte an $lte", async () => {
            const result = database.queryEvents({ data: { size: { $gte: 2, $lte: 4 } } });

            expect(result.total).toBe(3);
            expect(result.limit).toBe(10);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(3);
        });
    });
});
