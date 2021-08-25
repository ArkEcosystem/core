import "jest-extended";

import { Action } from "@packages/core-manager/src/actions/process-delete";
import { Identifiers } from "@packages/core-manager/src/ioc";
import { Sandbox } from "@packages/core-test-framework";

let sandbox: Sandbox;
let action: Action;

let mockCli;
const deleteMethod = jest.fn();

beforeEach(() => {
    mockCli = {
        get: jest.fn().mockReturnValue({
            delete: deleteMethod,
        }),
    };

    sandbox = new Sandbox();

    sandbox.app.bind(Identifiers.CLI).toConstantValue(mockCli);

    action = sandbox.app.resolve(Action);
});

afterEach(() => {
    delete process.env.CORE_API_DISABLED;
    jest.clearAllMocks();
});

describe("Process:Delete", () => {
    it("should have name", () => {
        expect(action.name).toEqual("process.delete");
    });

    it("should resolve", async () => {
        const result = await action.execute({ name: "ark-core" });

        expect(result).toEqual({ });
        expect(deleteMethod).toHaveBeenCalled();
    });
});
