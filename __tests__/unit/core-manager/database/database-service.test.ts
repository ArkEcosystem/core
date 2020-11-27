import "jest-extended";

import { DatabaseService, Schema } from "@arkecosystem/core-manager/src/database/database-service";
import { existsSync } from "fs-extra";
import { dirSync, setGracefulCleanup } from "tmp";

let database: DatabaseService;
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
            database = new DatabaseService(storagePath, schema);

            // @ts-ignore
            const spyOnExec = jest.spyOn(database, "exec");

            database.boot();

            expect(existsSync(storagePath)).toBeTrue();
            expect(spyOnExec).toHaveBeenCalledTimes(1);
            expect(spyOnExec).toHaveBeenCalledWith(
                "PRAGMA journal_mode = WAL;\n" +
                    "CREATE TABLE IF NOT EXISTS table_1 (column_1 VARCHAR(255) NOT NULL);\n" +
                    "CREATE TABLE IF NOT EXISTS table_2 (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, column_1 VARCHAR(255) NOT NULL, column_2 VARCHAR(255) NOT NULL, column_3 VARCHAR(255), column_json JSON NOT NULL, timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);\n",
            );
        });
    });

    describe("Add", () => {
        beforeEach(() => {
            database = new DatabaseService(storagePath, schema);
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
        it("should return all data form table", () => {
            database = new DatabaseService(storagePath, schema);
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

            const result1 = database.getAll("table_1");
            expect(result1.length).toEqual(100);

            const result2 = database.getAll("table_2");
            expect(result2.length).toEqual(200);
        });

        it("should throw if table does not exist", () => {
            expect(() => {
                database.getAll("table_x");
            }).toThrow("Table table_x does not exists.");
        });
    });
});
