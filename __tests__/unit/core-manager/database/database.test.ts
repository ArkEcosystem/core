import "jest-extended";

import { Database, Schema } from "@arkecosystem/core-manager/src/database/database";
import { existsSync } from "fs-extra";
import { dirSync, setGracefulCleanup } from "tmp";

let database: Database;
let storagePath: string;

beforeEach(() => {
    storagePath = dirSync().name + "/test.sqlite";
});

afterEach(() => {
    setGracefulCleanup();
});

const jsonContent = {
    name: "name",
    nested: {
        name: "nested_name",
    },
};

const schema: Schema = {
    tables: [
        {
            name: "table_1",
            columns: [
                {
                    name: "column_1",
                    type: "varchar(255)",
                    index: true,
                },
            ],
        },
        {
            name: "table_2",
            columns: [
                {
                    name: "id",
                    type: "integer",
                    primary: true,
                    autoincrement: true,
                },
                {
                    name: "column_1",
                    type: "varchar(255)",
                    index: true,
                },
                {
                    name: "column_2",
                    type: "varchar(255)",
                },
                {
                    name: "column_3",
                    type: "varchar(255)",
                    nullable: true,
                },
                {
                    name: "column_json",
                    type: "json",
                },
                {
                    name: "timestamp",
                    type: "datetime",
                    default: "CURRENT_TIMESTAMP",
                },
            ],
        },
    ],
};

describe("DatabaseService", () => {
    describe("Boot", () => {
        it("should boot and create file", async () => {
            database = new Database(storagePath, schema, { defaultLimit: 10 });

            // @ts-ignore
            const spyOnExec = jest.spyOn(database, "exec");

            database.boot();

            expect(existsSync(storagePath)).toBeTrue();
            expect(spyOnExec).toHaveBeenCalledTimes(1);
            expect(spyOnExec).toHaveBeenCalledWith(
                "PRAGMA journal_mode = WAL;\n" +
                    "CREATE TABLE IF NOT EXISTS table_1 (column_1 VARCHAR(255) NOT NULL);\n" +
                    "CREATE TABLE IF NOT EXISTS table_2 (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, column_1 VARCHAR(255) NOT NULL, column_2 VARCHAR(255) NOT NULL, column_3 VARCHAR(255), column_json JSON NOT NULL, timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);\n" +
                    "CREATE INDEX IF NOT EXISTS index_table_1_column_1 ON table_1 (column_1);\n" +
                    "CREATE INDEX IF NOT EXISTS index_table_2_column_1 ON table_2 (column_1);\n",
            );
        });

        it("should boot with flush option", async () => {
            database = new Database(storagePath, schema);

            // @ts-ignore
            const spyOnFlush = jest.spyOn(database, "flush");

            database.boot();
            expect(spyOnFlush).toHaveBeenCalledTimes(0);

            database.boot(true);

            expect(existsSync(storagePath)).toBeTrue();
            expect(spyOnFlush).toHaveBeenCalledTimes(1);
        });
    });

    describe("Dispose", () => {
        it("should close database", async () => {
            database = new Database(storagePath, schema);

            // @ts-ignore
            const spyOnClose = jest.spyOn(database.database, "close");

            database.boot();
            database.dispose();

            expect(spyOnClose).toHaveBeenCalledTimes(1);
        });
    });

    describe("Flush", () => {
        it("should flush database", async () => {
            database = new Database(storagePath, schema);

            // @ts-ignore
            const spyOnPrepare = jest.spyOn(database.database, "prepare");

            database.boot();
            database.flush();

            expect(spyOnPrepare).toHaveBeenCalledTimes(2);
            expect(spyOnPrepare).toHaveBeenCalledWith("DELETE FROM table_1");
            expect(spyOnPrepare).toHaveBeenCalledWith("DELETE FROM table_2");
        });
    });

    describe("Add", () => {
        beforeEach(() => {
            database = new Database(storagePath, schema);
            database.boot();
            expect(existsSync(storagePath)).toBeTrue();
        });

        it("should add data to table_1", () => {
            database.add("table_1", {
                column_1: "string content",
            });

            const result = database.getAll("table_1");
            expect(result.length).toEqual(1);
            expect(result).toEqual([
                {
                    column_1: "string content",
                },
            ]);
        });

        it("should add data to table_2", () => {
            database.add("table_2", {
                column_1: "content 1",
                column_2: "content 2",
                column_json: jsonContent,
            });

            const result = database.getAll("table_2");
            expect(result.length).toEqual(1);
            expect(result[0]).toEqual({
                id: 1,
                column_1: "content 1",
                column_2: "content 2",
                column_3: null,
                column_json: jsonContent,
                timestamp: expect.toBeString(),
            });
        });

        it("should add data if contains extra fields", () => {
            database.add("table_1", {
                column_1: "string content",
                random: "test",
            });

            const result = database.getAll("table_1");
            expect(result.length).toEqual(1);
            expect(result).toEqual([
                {
                    column_1: "string content",
                },
            ]);
        });

        it("should throw if table does not exist", () => {
            expect(() => {
                database.add("table_x", {
                    column_1: "string content",
                });
            }).toThrow("Table table_x does not exists.");
        });

        it("should throw if required column is missing", () => {
            expect(() => {
                database.add("table_2", {
                    column_1: "content 1",
                });
            }).toThrow("NOT NULL constraint failed: table_2.column_2");
        });

        it("should throw if data is empty", () => {
            expect(() => {
                database.add("table_1", {});
            }).toThrow();
        });

        it("should throw if data is null", () => {
            expect(() => {
                database.add("table_1", null);
            }).toThrow();
        });

        it("should throw if data is undefined", () => {
            expect(() => {
                database.add("table_1", undefined);
            }).toThrow();
        });
    });

    describe("GetAll", () => {
        beforeEach(() => {
            database = new Database(storagePath, schema);
            database.boot();
            expect(existsSync(storagePath)).toBeTrue();

            for (let i = 0; i < 100; i++) {
                database.add("table_1", {
                    column_1: "string content",
                });
            }

            for (let i = 0; i < 200; i++) {
                database.add("table_2", {
                    column_1: "content 1",
                    column_2: "content 2",
                    column_json: jsonContent,
                });
            }
        });

        it("should return all data form table", () => {
            const result1 = database.getAll("table_1");
            expect(result1.length).toEqual(100);

            const result2 = database.getAll("table_2");
            expect(result2.length).toEqual(200);
        });

        it("should return all using conditions", () => {
            const result1 = database.getAll("table_2", { id: { $lte: 30 } });
            expect(result1.length).toEqual(30);
        });

        it("should throw if table does not exist", () => {
            expect(() => {
                database.getAll("table_x");
            }).toThrow("Table table_x does not exists.");
        });
    });

    describe("GetTotal", () => {
        beforeEach(() => {
            database = new Database(storagePath, schema);
            database.boot();

            database.add("table_1", {
                column_1: "content 1",
            });

            database.add("table_1", {
                column_1: "content 2",
            });

            database.add("table_2", {
                column_1: "content 1",
                column_2: "content 1",
                column_json: {
                    value: 1,
                },
            });

            database.add("table_2", {
                column_1: "content 2",
                column_2: "content 2",
                column_json: {
                    value: 2,
                },
            });
        });

        it("should count all items if conditions are empty", () => {
            expect(database.getTotal("table_1")).toEqual(2);
            expect(database.getTotal("table_2")).toEqual(2);
        });

        it("should count with query on non-json field", () => {
            expect(database.getTotal("table_1", { column_1: "content 1" })).toEqual(1);
            expect(database.getTotal("table_2", { column_1: "content 1" })).toEqual(1);
        });

        it("should count with query on json field", () => {
            expect(database.getTotal("table_2", { column_json: { value: 1 } })).toEqual(1);
        });
    });

    describe("Find", () => {
        beforeEach(() => {
            database = new Database(storagePath, schema, { defaultLimit: 10, maxLimit: 500 });
            database.boot();

            for (let i = 0; i < 100; i++) {
                database.add("table_1", {
                    column_1: "dummy_event",
                });
                database.add("table_1", {
                    column_1: "another_dummy_event",
                });
            }
        });

        it("should return expected item", async () => {
            const result = database.find("table_1", { $limit: 1, $offset: 0 });

            expect(result.total).toBe(200);
            expect(result.limit).toBe(1);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(1);
            expect(result.data[0]).toEqual({
                column_1: "dummy_event",
            });
        });

        it("should return limit 10", async () => {
            const result = database.find("table_1");

            expect(result.total).toBe(200);
            expect(result.limit).toBe(10);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(10);
        });

        it("should respect maxLimit", async () => {
            const result = database.find("table_1", { $limit: 700 });

            expect(result.total).toBe(200);
            expect(result.limit).toBe(500);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(200);
        });

        it("should return limit 10 with offset", async () => {
            const result = database.find("table_1", { $offset: 10 });

            expect(result.total).toBe(200);
            expect(result.limit).toBe(10);
            expect(result.offset).toBe(10);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(10);
        });

        it("should return limit 20", async () => {
            const result = database.find("table_1", { $limit: 20 });

            expect(result.total).toBe(200);
            expect(result.limit).toBe(20);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(20);
        });

        it("should return events with name", async () => {
            const result = database.find("table_1", { $limit: 500, column_1: "dummy_event" });

            expect(result.total).toBe(100);
            expect(result.limit).toBe(500);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(100);
        });

        it("should return empty result if searching by wrong type", async () => {
            const result = database.find("table_1", { $limit: 500, column_1: 1 });

            expect(result.total).toBe(0);
            expect(result.limit).toBe(500);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(0);
        });

        it("should throw if column does not exists", async () => {
            expect(() => {
                database.find("table_1", { column_x: 1 });
            }).toThrow("Column column_x does not exist on table table_1.");
        });

        it("should throw if table does not exists", async () => {
            expect(() => {
                database.find("table_x", { column_1: 1 });
            }).toThrow("Table table_x does not exists.");
        });
    });

    describe("Find JSON", () => {
        beforeEach(() => {
            database = new Database(storagePath, schema, { defaultLimit: 10 });
            database.boot();

            database.add("table_2", {
                column_1: "dummy_event",
                column_2: "",
                column_json: { size: 1, name: "1_dummy_event" },
            });
            database.add("table_2", {
                column_1: "dummy_event",
                column_2: "",
                column_json: { size: 2, name: "2_dummy_event" },
            });
            database.add("table_2", {
                column_1: "dummy_event",
                column_2: "",
                column_json: { size: 3, name: "3_dummy_event" },
            });
            database.add("table_2", {
                column_1: "dummy_event",
                column_2: "",
                column_json: { size: 4, name: "4_dummy_event" },
            });
            database.add("table_2", {
                column_1: "dummy_event",
                column_2: "",
                column_json: { size: 5, name: "5_dummy_event" },
            });
        });

        it("should return expected item", async () => {
            const result = database.find("table_2", { $limit: 1, $offset: 0 });

            expect(result.total).toBe(5);
            expect(result.limit).toBe(1);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(1);
            expect(result.data[0]).toEqual({
                id: 1,
                column_1: "dummy_event",
                column_2: "",
                column_3: null,
                column_json: { size: 1, name: "1_dummy_event" },
                timestamp: expect.toBeString(),
            });
        });

        it("should chose $eq by default", async () => {
            const result = database.find("table_2", { column_json: { size: 1 } });

            expect(result.total).toBe(1);
            expect(result.limit).toBe(10);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(1);
        });

        it("should use $eq on string", async () => {
            const result = database.find("table_2", { column_json: { name: { $eq: "1_dummy_event" } } });

            expect(result.total).toBe(1);
            expect(result.limit).toBe(10);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(1);
        });

        it("should use $ne", async () => {
            const result = database.find("table_2", { column_json: { size: { $ne: 3 } } });

            expect(result.total).toBe(4);
            expect(result.limit).toBe(10);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(4);
        });

        it("should use $like on string", async () => {
            const result = database.find("table_2", { column_json: { name: { $like: "1_%" } } });

            expect(result.total).toBe(1);
            expect(result.limit).toBe(10);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(1);
        });

        it("should use $in on number type", async () => {
            const result = database.find("table_2", { column_json: { size: { $in: [1, 2] } } });

            expect(result.total).toBe(2);
            expect(result.limit).toBe(10);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(2);
        });

        it("should use $in on string type", async () => {
            const result = database.find("table_2", {
                column_json: { name: { $in: ["1_dummy_event", "2_dummy_event"] } },
            });

            expect(result.total).toBe(2);
            expect(result.limit).toBe(10);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(2);
        });

        it("should use $lt", async () => {
            const result = database.find("table_2", { column_json: { size: { $lt: 2 } } });

            expect(result.total).toBe(1);
            expect(result.limit).toBe(10);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(1);
        });

        it("should use $lte", async () => {
            const result = database.find("table_2", { column_json: { size: { $lte: 2 } } });

            expect(result.total).toBe(2);
            expect(result.limit).toBe(10);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(2);
        });

        it("should use $gt", async () => {
            const result = database.find("table_2", { column_json: { size: { $gt: 4 } } });

            expect(result.total).toBe(1);
            expect(result.limit).toBe(10);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(1);
        });

        it("should use $gte", async () => {
            const result = database.find("table_2", { column_json: { size: { $gte: 4 } } });

            expect(result.total).toBe(2);
            expect(result.limit).toBe(10);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(2);
        });

        it("should use $gte an $lte", async () => {
            const result = database.find("table_2", { column_json: { size: { $gte: 2, $lte: 4 } } });

            expect(result.total).toBe(3);
            expect(result.limit).toBe(10);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(3);
        });
    });

    describe("Remove", () => {
        beforeEach(() => {
            database = new Database(storagePath, schema);
            database.boot();

            for (let i = 0; i < 100; i++) {
                database.add("table_1", {
                    column_1: "dummy_event",
                });
                database.add("table_1", {
                    column_1: "another_dummy_event",
                });
            }
        });

        it("should remove all table data", () => {
            expect(database.getAll("table_1").length).toEqual(200);

            database.remove("table_1");

            expect(database.getAll("table_1").length).toEqual(0);
        });

        it("should remove partially", () => {
            expect(database.getAll("table_1").length).toEqual(200);

            database.remove("table_1", { column_1: "dummy_event" });

            expect(database.getAll("table_1").length).toEqual(100);
        });
    });
});
