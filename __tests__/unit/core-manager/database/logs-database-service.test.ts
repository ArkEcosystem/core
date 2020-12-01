import "jest-extended";

import { Container } from "@arkecosystem/core-kernel";
// import { Database } from "@arkecosystem/core-manager/src/database/database";
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

        // it("should boot, create file and flush", async () => {
        //     const spyOnFlush = jest.spyOn(Database.prototype, "flush");
        //
        //     configuration.getRequired = jest.fn().mockReturnValue({
        //         storage: storagePath,
        //         resetDatabase: true,
        //     });
        //
        //     database.boot();
        //     expect(existsSync(storagePath)).toBeTrue();
        //
        //     expect(spyOnFlush).toHaveBeenCalledTimes(1);
        // });
        //
        // it("should boot without watcher storage in defaults", async () => {
        //     configuration.getRequired = jest.fn().mockReturnValue({});
        //
        //     storagePath = dirSync().name;
        //     process.env.CORE_PATH_DATA = storagePath;
        //
        //     database.boot();
        //
        //     expect(existsSync(storagePath + "/events.sqlite")).toBeTrue();
        // });
    });

    describe("Dispose", () => {
        it("should dispose", async () => {
            database.boot();
            database.dispose();

            expect(() => {
                database.add("info", "log content");
            }).toThrowError();
        });
    });

    describe("Add", () => {
        it("should add log", async () => {
            database.boot();
            expect(existsSync(storagePath)).toBeTrue();

            database.add("info", "content");

            const result = database.find().data;

            expect(result).toBeArray();
            expect(result[0]).toMatchObject({
                id: 1,
                process: "core",
                level: "info",
                content: "content",
            });

            expect(result[0].timestamp).toBeDefined();
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
            const result = database.find({ $limit: 1000 });

            expect(result.total).toBe(200);
            expect(result.limit).toBe(1000);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(200);
        });

        it("should filter by log type", async () => {
            const result = database.find({ $limit: 1000, level: "info" });

            expect(result.total).toBe(100);
            expect(result.limit).toBe(1000);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(100);
        });

        it("should filter by content", async () => {
            const result = database.find({ $limit: 1000, content: "info content" });

            expect(result.total).toBe(100);
            expect(result.limit).toBe(1000);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(100);
        });

        it("should search in content", async () => {
            const result = database.find({ $limit: 1000, content: { $like: "%nfo%" } });

            expect(result.total).toBe(100);
            expect(result.limit).toBe(1000);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(100);
        });

        it("should search by datetime", () => {
            // @ts-ignore
            database.database.exec(`UPDATE logs SET timestamp = '2016-01-02 00:00:00.000' WHERE id = 1`);

            // const result = database.find({
            //     $limit: 1000,
            //     timestamp: { $gte: "2016-01-01 00:00:00.000", $lte: "2016-01-03 00:00:00.000" },
            // });

            const result = database.search({
                dateFrom: "2016-01-01 00:00:00.000",
                dateTo: "2016-01-03 00:00:00.000",
            });

            expect(result.total).toBe(1);
            // expect(result.limit).toBe(1000);
            expect(result.offset).toBe(0);
            expect(result.data).toBeArray();
            expect(result.data.length).toBe(1);
        });
    });
});
