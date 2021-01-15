import "jest-extended";

import { Container } from "@arkecosystem/core-kernel";
import { Database } from "@arkecosystem/core-manager/src/database/database";
import { LogsDatabaseService } from "@arkecosystem/core-manager/src/database/logs-database-service";
import { Sandbox } from "@arkecosystem/core-test-framework";
import { existsSync } from "fs-extra";
import { dirSync, setGracefulCleanup } from "tmp";

let database: LogsDatabaseService;
let storagePath: string;
let sandbox: Sandbox;
let configFlags: any;
let configuration: any;

beforeEach(() => {
    storagePath = dirSync().name + "/logs.sqlite";

    configFlags = {
        processType: "core",
    };

    configuration = {
        getRequired: jest.fn().mockReturnValue({
            storage: storagePath,
            resetDatabase: false,
            history: 30,
        }),
    };

    sandbox = new Sandbox();

    sandbox.app.bind(Container.Identifiers.ConfigFlags).toConstantValue(configFlags);
    sandbox.app.bind(Container.Identifiers.PluginConfiguration).toConstantValue(configuration);

    database = sandbox.app.resolve(LogsDatabaseService);
});

afterEach(() => {
    setGracefulCleanup();

    jest.clearAllMocks();
    jest.resetAllMocks();
});

describe("LogsDatabaseService", () => {
    describe("Boot", () => {
        it("should boot and create file", async () => {
            database.boot();
            expect(existsSync(storagePath)).toBeTrue();
        });

        it("should boot, create file and flush", async () => {
            const spyOnFlush = jest.spyOn(Database.prototype, "flush");

            configuration.getRequired = jest.fn().mockReturnValue({
                storage: storagePath,
                resetDatabase: true,
                history: 30,
            });

            database.boot();
            expect(existsSync(storagePath)).toBeTrue();

            expect(spyOnFlush).toHaveBeenCalledTimes(1);
        });
    });

    describe("Dispose", () => {
        it("should dispose", async () => {
            database.boot();
            database.dispose();
        });

        it("should not throw if add is called after dispose", async () => {
            database.boot();
            database.dispose();

            expect(() => {
                database.add("info", "log content");
            }).not.toThrowError();
        });
    });

    describe("Add", () => {
        it("should add log", async () => {
            database.boot();
            expect(existsSync(storagePath)).toBeTrue();

            database.add("info", "content");

            const result = database.search({}).data;

            expect(result).toBeArray();
            expect(result[0]).toMatchObject({
                id: 1,
                process: "core",
                level: "info",
                content: "content",
            });

            expect(result[0].timestamp).toBeNumber();
        });

        it("should remove old logs", async () => {
            database.boot();
            expect(existsSync(storagePath)).toBeTrue();

            database.add("info", "content");

            let result = database.search({}).data;

            expect(result.length).toEqual(1);

            // @ts-ignore
            database.database.exec(`UPDATE logs SET timestamp = 1451696400 WHERE id = 1`);

            database.add("info", "content");

            result = database.search({}).data;

            expect(result.length).toEqual(1);
        });
    });

    describe("Query", () => {
        beforeEach(() => {
            database.boot();

            for (let i = 0; i < 100; i++) {
                database.add("info", "info content");
                database.add("warning", "warning content");
            }
        });

        it("should return all", async () => {
            const result = database.search({ limit: 1000 });

            expect(result.total).toBe(200);
            expect(result.limit).toBe(1000);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(200);
        });

        it("should filter by log level", async () => {
            const result = database.search({ limit: 1000, level: "info" });

            expect(result.total).toBe(100);
            expect(result.limit).toBe(1000);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(100);
        });

        it("should filter by process", async () => {
            let result = database.search({ limit: 1000, process: "core" });

            expect(result.total).toBe(200);
            expect(result.limit).toBe(1000);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(200);

            result = database.search({ limit: 1000, process: "forger" });

            expect(result.total).toBe(0);
            expect(result.limit).toBe(1000);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(0);
        });

        it("should search in content", async () => {
            const result = database.search({
                limit: 1000,
                searchTerm: "nfo",
            });

            expect(result.total).toBe(100);
            expect(result.limit).toBe(1000);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(100);
        });

        it("should search by datetime", () => {
            // @ts-ignore
            database.database.exec(`UPDATE logs SET timestamp = 1451696400 WHERE id = 1`);

            let result = database.search({
                limit: 1000,
                dateFrom: 1451610000,
            });

            expect(result.total).toBe(200);
            expect(result.limit).toBe(1000);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(200);

            result = database.search({
                limit: 1000,
                dateTo: 1451782800,
            });

            expect(result.total).toBe(1);
            expect(result.limit).toBe(1000);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(1);

            result = database.search({
                limit: 1000,
                dateFrom: 1451610000,
                dateTo: 1451782800,
            });

            expect(result.total).toBe(1);
            expect(result.limit).toBe(1000);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(1);
        });

        it("should search with offset", () => {
            let result = database.search({
                limit: 1,
            });

            expect(result.total).toBe(200);
            expect(result.limit).toBe(1);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(1);
            expect(result.data[0].id).toBe(200);

            result = database.search({
                limit: 1,
                offset: 10,
            });

            expect(result.total).toBe(200);
            expect(result.limit).toBe(1);
            expect(result.offset).toBe(10);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(1);
            expect(result.data[0].id).toBe(190);
        });

        it("should sort by order", () => {
            let result = database.search({});

            expect(result.total).toBe(200);
            expect(result.limit).toBe(100);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(100);
            expect(result.data[0].id).toBe(200);

            result = database.search({
                order: "ASC",
            });

            expect(result.total).toBe(200);
            expect(result.limit).toBe(100);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(100);
            expect(result.data[0].id).toBe(1);
        });
    });
});
