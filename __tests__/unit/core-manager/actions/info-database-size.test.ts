import "jest-extended";

import { Action } from "@packages/core-manager/src/actions/info-database-size";
import { Identifiers } from "@packages/core-snapshots";
import { Sandbox } from "@packages/core-test-framework";

let sandbox: Sandbox;
let action: Action;
const databaseConnection = {
    query: jest.fn().mockReturnValue([
        {
            pg_database_size: 1024,
        },
    ]),
    options: {
        database: "database_name",
    },
};

beforeEach(() => {
    sandbox = new Sandbox();

    sandbox.app.bind(Identifiers.SnapshotDatabaseConnection).toConstantValue(databaseConnection);

    action = sandbox.app.resolve(Action);
});

describe("Info:DatabaseSize", () => {
    it("should have name", () => {
        expect(action.name).toEqual("info.databaseSize");
    });

    it("should return database size", async () => {
        const result = await action.execute();

        await expect(result.size).toBe(1);
    });
});
