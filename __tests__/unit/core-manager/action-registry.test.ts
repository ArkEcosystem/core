import "jest-extended";

import { Sandbox } from "@packages/core-test-framework";
import { Identifiers } from "@packages/core-manager/src/ioc";
import { ActionRegistry, Exceptions } from "@packages/core-manager";
import { Actions } from "@packages/core-manager/src/contracts";

let sandbox: Sandbox;

class DummyAction implements Actions.Action {
    public name = "dummy";

    public async execute(data: object): Promise<object> {
        return data
    }
}

let dummyAction = new DummyAction();

beforeEach(() => {
    sandbox = new Sandbox();

    sandbox.app.bind(Identifiers.ActionRegistry).to(ActionRegistry).inSingletonScope();
});

describe("ActionRegistry", () => {
    describe("initialize", () => {
        it("should init", async () => {
            let actionRegistry = sandbox.app.get<ActionRegistry>(Identifiers.ActionRegistry);

            expect(actionRegistry).toBeDefined();
        });
    })


    describe("registerAction", () => {
        it("should register action", async () => {
            let actionRegistry = sandbox.app.get<ActionRegistry>(Identifiers.ActionRegistry);

            actionRegistry.registerAction(dummyAction);
        });

        it("should throw error if action with same name already exist", async () => {
            let actionRegistry = sandbox.app.get<ActionRegistry>(Identifiers.ActionRegistry);

            actionRegistry.registerAction(dummyAction);

            expect(() => { actionRegistry.registerAction(dummyAction) }).toThrowError(Exceptions.ActionRegistry.ActionAlreadyExistsException);
        });
    })

    describe("getAction", () => {
        it("should get action", async () => {
            let actionRegistry = sandbox.app.get<ActionRegistry>(Identifiers.ActionRegistry);
            actionRegistry.registerAction(dummyAction);

            expect(actionRegistry.getAction("dummy")).toEqual(dummyAction);
        });

        it("should throw if action does not exists", async () => {
            let actionRegistry = sandbox.app.get<ActionRegistry>(Identifiers.ActionRegistry);
            actionRegistry.registerAction(dummyAction);

            expect(() => { actionRegistry.getAction("invalid") }).toThrowError(Exceptions.ActionRegistry.ActionNotFoundException);
        });
    })
});
