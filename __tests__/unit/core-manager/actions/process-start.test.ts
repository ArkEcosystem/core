import "jest-extended";

import { Action } from "@packages/core-manager/src/actions/process-start";
import { Identifiers } from "@packages/core-manager/src/ioc";
import { Sandbox } from "@packages/core-test-framework";

let sandbox: Sandbox;
let action: Action;

const mockCliManager = {
    runCommand: jest.fn(),
};

beforeEach(() => {
    sandbox = new Sandbox();

    sandbox.app.bind(Identifiers.CliManager).toConstantValue(mockCliManager);

    action = sandbox.app.resolve(Action);
});

afterEach(() => {
    delete process.env.CORE_API_DISABLED;
    jest.clearAllMocks();
});

describe("Process:Start", () => {
    it("should have name", () => {
        expect(action.name).toEqual("process.start");
    });

    it("should call start process", async () => {
        const result = await action.execute({ name: "core", args: "--network=testnet --env=test" });

        expect(result).toEqual({});
        expect(mockCliManager.runCommand).toHaveBeenCalledWith("core:start", "--network=testnet --env=test");
    });
});
