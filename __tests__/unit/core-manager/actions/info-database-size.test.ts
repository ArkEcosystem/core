import "jest-extended";

import { Container } from "@packages/core-kernel";
import { Action } from "@packages/core-manager/src/actions/info-database-size";
import { defaults } from "@packages/core-manager/src/defaults";
import { Sandbox } from "@packages/core-test-framework";
import * as typeorm from "typeorm";

let sandbox: Sandbox;
let action: Action;

// @ts-ignore
jest.spyOn(typeorm, "createConnection").mockImplementation(async () => {
    return {
        query: jest.fn().mockResolvedValue([
            {
                pg_size_pretty: "100 MB",
            },
        ]),
        close: jest.fn(),
    };
});

beforeEach(() => {
    sandbox = new Sandbox();

    sandbox.app.bind(Container.Identifiers.PluginConfiguration).toConstantValue({
        get: jest.fn().mockReturnValue({ ...defaults.connection }),
    });

    action = sandbox.app.resolve(Action);
});

describe("Info:DatabaseSize", () => {
    it("should have name", () => {
        expect(action.name).toEqual("info.databaseSize");
    });

    it("should return database size", async () => {
        const result = await action.execute();

        await expect(result.size).toBe("100 MB");
    });
});
