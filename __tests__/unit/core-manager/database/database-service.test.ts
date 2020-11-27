import "jest-extended";

import { DatabaseService } from "@arkecosystem/core-manager/src/database/database-service";
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

const schema = {

}

describe("DatabaseService", () => {
    describe("Boot", () => {
        it("should boot and create file", async () => {
            database = new DatabaseService(storagePath, "test");

            database.boot();

            expect(existsSync(storagePath)).toBeTrue();
        });
    });
});
