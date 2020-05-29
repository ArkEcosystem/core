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
});
