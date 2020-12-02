import "jest-extended";

import { Container } from "@packages/core-kernel";
import { Action } from "@packages/core-manager/src/actions/watcher-get-events";
import { Identifiers } from "@packages/core-manager/src/ioc";
import { Sandbox } from "@packages/core-test-framework";

let sandbox: Sandbox;
let action: Action;

const emptyResult = {
    total: 0,
    limit: 0,
    offset: 0,
    data: [],
};

const mockDatabaseService = {
    find: jest.fn().mockReturnValue(emptyResult),
};

beforeEach(() => {
    sandbox = new Sandbox();

    sandbox.app.bind(Container.Identifiers.ApplicationVersion).toConstantValue("dummyVersion");
    sandbox.app.bind(Identifiers.WatcherDatabaseService).toConstantValue(mockDatabaseService);

    action = sandbox.app.resolve(Action);
});

describe("Watcher:GetEvents", () => {
    it("should have name", () => {
        expect(action.name).toEqual("watcher.getEvents");
    });

    it("should return current and latest version", async () => {
        const result = await action.execute({ query: {} });

        await expect(result).toEqual(emptyResult);
    });
});
