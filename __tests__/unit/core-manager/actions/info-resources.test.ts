import "jest-extended";

import { Action } from "@packages/core-manager/src/actions/info-resources";
import { Sandbox } from "@packages/core-test-framework";

let sandbox: Sandbox;
let action: Action;

beforeEach(() => {
    sandbox = new Sandbox();

    action = sandbox.app.resolve(Action);
});

describe("Info:Resources", () => {
    it("should have name", () => {
        expect(action.name).toEqual("info.resources");
    });
});
