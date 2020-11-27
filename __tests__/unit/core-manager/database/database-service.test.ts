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
                    "CREATE TABLE IF NOT EXISTS table_1 (column_1 VARCHAR(255) NOT NULL);\n",
            );
        });
    });

    describe("Add", () => {
        it("should add data to table", () => {
            database = new DatabaseService(storagePath, schema);
            database.boot();
            expect(existsSync(storagePath)).toBeTrue();

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
    });

    // describe("GetAll", () => {
    //     it("should return added data from table", () => {
    //         database = new DatabaseService(storagePath, schema);
    //         database.boot();
    //         expect(existsSync(storagePath)).toBeTrue();
    //
    //         database.add("table_1", {
    //             column_1: "string content",
    //         });
    //
    //         const result = database.getAll("table_1");
    //
    //         expect(result.length).toEqual(1);
    //         expect(result).toEqual([
    //             {
    //                 column_1: "string content",
    //             },
    //         ]);
    //     });
    // });
});
