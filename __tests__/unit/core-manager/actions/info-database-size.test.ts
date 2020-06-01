import "jest-extended";

import { Action } from "@packages/core-manager/src/actions/info-database-size";
import { Sandbox } from "@packages/core-test-framework/src";
import * as typeorm from "typeorm";

let sandbox: Sandbox;
let action: Action;

// @ts-ignore
jest.spyOn(typeorm, "createConnection").mockImplementation(async () => {
    return {
        query: jest.fn().mockResolvedValue([
            {
                pg_database_size: 1024,
            },
        ]),
        close: jest.fn(),
    };
});

beforeEach(() => {
    sandbox = new Sandbox();

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
