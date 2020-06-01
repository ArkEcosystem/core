import "jest-extended";

import { ProcessState } from "@packages/core-cli/src/contracts";
import { Action } from "@packages/core-manager/src/actions/process.stop";
import { Identifiers } from "@packages/core-manager/src/ioc";
import { Sandbox } from "@packages/core-test-framework/src";

let sandbox: Sandbox;
let action: Action;

let mockCli;

beforeEach(() => {
    mockCli = {
        get: jest.fn().mockReturnValue({
            status: jest.fn().mockReturnValue(ProcessState.Stopped),
            stop: jest.fn(),
        }),
    };

    sandbox = new Sandbox();

    sandbox.app.bind(Identifiers.CLI).toConstantValue(mockCli);

    action = sandbox.app.resolve(Action);
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("Process:Stop", () => {
    it("should have name", () => {
        expect(action.name).toEqual("process.stop");
    });

    it("should return stopped process status", async () => {
        const result = await action.execute({ name: "ark-core" });

        expect(result).toEqual({
            name: "ark-core",
            status: "stopped",
        });
    });
});
