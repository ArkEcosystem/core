import "jest-extended";

import { Sandbox } from "@packages/core-test-framework";
import { Identifiers } from "@packages/core-manager/src/ioc";
import { ActionReader } from "@packages/core-manager";

let sandbox: Sandbox;
let actionReader: ActionReader;

beforeEach(() => {
    sandbox = new Sandbox();

    sandbox.app.bind(Identifiers.ActionReader).to(ActionReader).inSingletonScope();

    actionReader = sandbox.app.get<ActionReader>(Identifiers.ActionReader);
});

describe("ActionReader", () => {
    it("should discover actions", async () => {
        let actions = actionReader.discoverActions();

        expect(actions).toBeArray();
        expect(actions.length).toBeGreaterThanOrEqual(1);
    });
});
