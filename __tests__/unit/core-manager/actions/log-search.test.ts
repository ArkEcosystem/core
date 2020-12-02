import "jest-extended";

import { Action } from "@packages/core-manager/src/actions/log-search";
import { Identifiers } from "@packages/core-manager/src/ioc";
import { Sandbox } from "@packages/core-test-framework";

let sandbox: Sandbox;
let action: Action;

let logDatabaseService;

beforeEach(() => {
    logDatabaseService = {
        search: jest.fn(),
    };

    sandbox = new Sandbox();

    sandbox.app.bind(Identifiers.LogsDatabaseService).toConstantValue(logDatabaseService);

    action = sandbox.app.resolve(Action);
});

describe("Log:Search", () => {
    it("should have name", () => {
        expect(action.name).toEqual("log.search");
    });

    it("should return lines from out log", async () => {
        await action.execute({});

        expect(logDatabaseService.search).toHaveBeenCalledTimes(1);
    });
});
