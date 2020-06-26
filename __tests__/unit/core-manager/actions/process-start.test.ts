import "jest-extended";

import { Action } from "@packages/core-manager/src/actions/process-start";
import { Identifiers } from "@packages/core-manager/src/ioc";
import { Sandbox } from "@packages/core-test-framework";

let sandbox: Sandbox;
let action: Action;

let mockCli;

const mockCoreStart = {
    register: jest.fn(),
    run: jest.fn(),
};

let mockCommands;

beforeEach(() => {
    mockCommands = {
        ["core:start"]: mockCoreStart,
    };

    mockCli = {
        resolve: jest.fn().mockReturnValue({
            within: jest.fn().mockImplementation(() => {
                return mockCommands;
            }),
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

describe("Process:Start", () => {
    it("should have name", () => {
        expect(action.name).toEqual("process.start");
    });

    it("should start ", async () => {
        const result = await action.execute({ name: "core", args: "--network=testnet --env=test" });

        expect(result).toEqual({});
    });

    it("should throw error if name is command cannot be found ", async () => {
        mockCommands = {
            ["core:invalid"]: mockCoreStart,
        };

        await expect(action.execute({ name: "core", args: "--network=testnet --env=test" })).rejects.toThrowError();
    });

    it("should throw error if name is invalid ", async () => {
        await expect(action.execute({ name: "invalid", args: "--network=testnet --env=test" })).rejects.toThrowError();
    });
});
