import "jest-extended";

import { Container } from "@arkecosystem/core-kernel";
import { DatabaseLogger } from "@packages/core-manager/src/database-logger";
import { Identifiers } from "@packages/core-manager/src/ioc";
import { Sandbox } from "@packages/core-test-framework/src";

let sandbox: Sandbox;
let databaseLogger: DatabaseLogger;

const mockDatabaseService = {
    addEvent: jest.fn(),
};

beforeEach(() => {
    sandbox = new Sandbox();

    sandbox.app.bind(Identifiers.WatcherDatabaseService).toConstantValue(mockDatabaseService);
    sandbox.app.bind(Container.Identifiers.DatabaseLogger).to(DatabaseLogger);

    databaseLogger = sandbox.app.get<DatabaseLogger>(Container.Identifiers.DatabaseLogger);
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("DatabaseLogger", () => {
    it(".log", async () => {
        databaseLogger.log("log", "dummy_message");

        expect(mockDatabaseService.addEvent).toHaveBeenCalledWith("database.log", "dummy_message");

        databaseLogger.log("info", "dummy_message");

        expect(mockDatabaseService.addEvent).toHaveBeenCalledWith("database.info", "dummy_message");

        databaseLogger.log("warn", "dummy_message");

        expect(mockDatabaseService.addEvent).toHaveBeenCalledWith("database.warn", "dummy_message");
    });

    it(".logMigration", async () => {
        databaseLogger.logMigration("dummy_message");

        expect(mockDatabaseService.addEvent).toHaveBeenCalledWith("database.migration", "dummy_message");
    });

    it(".logQuery", async () => {
        databaseLogger.logQuery("dummy_query", ["dummy_parameter"]);

        expect(mockDatabaseService.addEvent).toHaveBeenCalledWith("database.query.log", {
            query: "dummy_query",
            parameters: ["dummy_parameter"],
        });
    });

    it(".logQueryError", async () => {
        databaseLogger.logQueryError("dummy_error", "dummy_query", ["dummy_parameter"]);

        expect(mockDatabaseService.addEvent).toHaveBeenCalledWith("database.query.error", {
            error: "dummy_error",
            query: "dummy_query",
            parameters: ["dummy_parameter"],
        });
    });

    it(".logQuerySlow", async () => {
        databaseLogger.logQuerySlow(1000, "dummy_query", ["dummy_parameter"]);

        expect(mockDatabaseService.addEvent).toHaveBeenCalledWith("database.query.slow", {
            time: 1000,
            query: "dummy_query",
            parameters: ["dummy_parameter"],
        });
    });

    it(".logSchemaBuild", async () => {
        databaseLogger.logSchemaBuild("dummy_message");

        expect(mockDatabaseService.addEvent).toHaveBeenCalledWith("database.schemaBuild", "dummy_message");
    });
});
