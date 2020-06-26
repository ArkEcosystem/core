import "jest-extended";

import { ProcessState } from "@packages/core-cli/src/contracts";
import { Action } from "@packages/core-manager/src/actions/process-restart";
import { Identifiers } from "@packages/core-manager/src/ioc";
import { Sandbox } from "@packages/core-test-framework";

let sandbox: Sandbox;
let action: Action;

let mockCli;
let mockProcessManagerStatus;

beforeEach(() => {
    mockProcessManagerStatus = ProcessState.Online;

    mockCli = {
        get: jest.fn().mockReturnValue({
            status: jest.fn().mockImplementation(() => {
                return mockProcessManagerStatus;
            }),
            restart: jest.fn(),
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

describe("Process:Restart", () => {
    it("should have name", () => {
        expect(action.name).toEqual("process.restart");
    });

    it("should return status and syncing using HTTP", async () => {
        const result = await action.execute({ name: "ark-core" });

        expect(result).toEqual({ name: "ark-core", status: "online" });
    });

    it("should return status undefined if processManager status is undefined", async () => {
        mockProcessManagerStatus = undefined;

        const result = await action.execute({ name: "ark-core" });

        expect(result).toEqual({ name: "ark-core", status: "undefined" });
    });
});
